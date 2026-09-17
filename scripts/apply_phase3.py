#!/usr/bin/env python3
"""
Phase 3: rename scoped assets, build narrowed content.json (books, articles, awards, CV).
Run from repo root: python scripts/apply_phase3.py
"""
from __future__ import annotations

import json
import os
import re
import shutil
import time
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
AUTHOR_SUFFIX = " — Nasr El Din Ibrahim Ahmed Hussein"
AUTHOR_AR = "أ.د. نصر الدين إبراهيم أحمد حسين"
AUTHOR_EN = "Prof. Dr. Nasr El Din Ibrahim Ahmed Hussein"

BOOKS_DIR = ROOT / "books in the website"
ARTICLES_DIR = ROOT / "academic articles"
AWARDS_DIR = ROOT / "awards"
CV_DIR = ROOT / "site-content" / "cv"
CV_FILENAME = "CV — Prof Nasr El Din Ibrahim Ahmed Hussein (2025).pdf"
CONTENT_FILE = ROOT / "content.json"
PHASE2_FILE = ROOT / "scripts" / "phase2-title-scan.json"
MANIFEST_FILE = ROOT / "scripts" / "phase3-manifest.json"

BOOK_TITLES = {
    "Book 1 - 270 page.pdf": "وجوه الإعجاز في الخطاب الأسلوبي والمعرفي للقرآن الكريم",
    "Book 2 - 204 page.pdf": "وجوه الإعجاز في الخطاب الأسلوبي والمعرفي للقرآن الكريم (نسخة أخرى)",
    "Book 3 - 176 page.pdf": "النقد في العصر الجاهلي: الذاتية والموضوعية",
    "Book 4 - 359 page.pdf": "الخطاب البلاغي وعلاقته بالدرس القرآني والأدبي",
    "Book 5 - 214 page.pdf": "مكانة أصحاب القدرات الخاصة في التدريس والأدب العربي",
    "Book 6 - 277 page.pdf": "إشكالية الالتزام الإسلامي",
    "Book 7 - 289 page.pdf": "نظرية الأدب العربي الأسلوبي",
    "Book 8 - 310 page.pdf": "الإمام عبد القاهر الجرجاني: حياته ومصادر ثقافته المعرفية",
    "Book 9 - 296 page.pdf": "كتب طبقات الشعراء: وقضايا النقد الأدبي",
    "Book 10 - 201 page.pdf": "النقد المنهجي في كتب طبقات الشعراء",
    "Book 11 - 194 page.pdf": "مراجعات في النقد الأدبي القديم",
    "Book 12 - 362 page.pdf": "الأدب الإسلامي، الإطار والمنهج",
    "Book 13 - 377 page.pdf": "الأدب الإسلامي: دراسة نظرية وتطبيقية",
    "Book 14 - 256 page.pdf": "بماليزيا نحو إطار إسلامي للشعر",
}

ARTICLE_TITLE_OVERRIDES = {
    "academic articles/IJASOS- International E-Journal of Advances in Social Sciences,/توظيف العناصر الفنية في رواية بن سولع للكاتب علي المعمري.pdf":
        "توظيف العناصر الفنية في رواية بن سولع للكاتب علي المعمري",
}

INVALID_WIN = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def uid(prefix: str) -> str:
    return f"{prefix}-{int(time.time() * 1000)}-{abs(hash(os.urandom(8))) % 10000:04d}"


def sanitize_filename(name: str) -> str:
    cleaned = INVALID_WIN.sub("", name).strip().rstrip(".")
    return cleaned or "document"


def strip_author_suffix(text: str) -> str:
    result = text.strip()
    while result.endswith(AUTHOR_SUFFIX):
        result = result[: -len(AUTHOR_SUFFIX)].strip()
    return result


def media_url(category: str, rel_path: str) -> str:
    rel = rel_path.replace("\\", "/")
    encoded = "/".join(quote(part, safe="") for part in rel.split("/"))
    return f"/media/{category}/{encoded}"


def load_phase2() -> dict[str, dict]:
    if not PHASE2_FILE.exists():
        return {}
    data = json.loads(PHASE2_FILE.read_text(encoding="utf-8"))
    out: dict[str, dict] = {}
    for item in data.get("items", []):
        path = item.get("current_path", "").replace("\\", "/")
        if path:
            out[path] = item
    return out


def pick_article_title(path_key: str, item: dict | None, filename: str) -> str:
    if path_key in ARTICLE_TITLE_OVERRIDES:
        return ARTICLE_TITLE_OVERRIDES[path_key]
    if item:
        conf = str(item.get("confidence", "")).lower()
        detected = (item.get("detected_title") or "").strip()
        hint = (item.get("content_json_hint") or "").strip()
        stem = strip_author_suffix(Path(filename).stem)
        if "high" in conf and detected and len(detected) > 8:
            return strip_author_suffix(detected)
        if stem and re.search(r"[\u0600-\u06FF]", stem) and len(stem) > 12:
            return stem
        if hint and re.search(r"[\u0600-\u06FF]", hint) and "book" not in hint.lower():
            return strip_author_suffix(hint)
        if detected and re.search(r"[\u0600-\u06FF]", detected):
            return strip_author_suffix(detected)
    stem = strip_author_suffix(Path(filename).stem)
    return stem if stem else filename


def rename_file(src: Path, new_name: str, manifest: list) -> Path:
    dst = src.with_name(new_name)
    if src.resolve() == dst.resolve():
        return src
    if dst.exists():
        manifest.append({"action": "skip_exists", "from": str(src.relative_to(ROOT)), "to": str(dst.relative_to(ROOT))})
        return dst
    src.rename(dst)
    manifest.append({"action": "rename", "from": str(src.relative_to(ROOT)), "to": str(dst.relative_to(ROOT))})
    return dst


def rename_books(manifest: list) -> list[dict]:
    entries = []
    if not BOOKS_DIR.is_dir():
        raise SystemExit(f"Missing folder: {BOOKS_DIR}")

    for src_name in sorted(BOOKS_DIR.glob("*.pdf"), key=lambda p: p.name):
        title = BOOK_TITLES.get(src_name.name)
        if not title:
            title = strip_author_suffix(src_name.stem)
            if not title:
                print(f"  warn: no title map for {src_name.name}")
                title = src_name.stem
        new_name = sanitize_filename(f"{title}{AUTHOR_SUFFIX}.pdf")
        dst = rename_file(src_name, new_name, manifest)
        rel = dst.relative_to(BOOKS_DIR).as_posix()
        entries.append({
            "id": uid("book"),
            "titleAr": title,
            "authorAr": AUTHOR_AR,
            "authorEn": AUTHOR_EN,
            "year": "",
            "coverImage": None,
            "pdf": {"url": media_url("books", rel), "filename": dst.name},
        })
    entries.sort(key=lambda b: b["titleAr"])
    return entries


def rename_articles(phase2: dict[str, dict], manifest: list) -> list[dict]:
    entries = []
    if not ARTICLES_DIR.is_dir():
        raise SystemExit(f"Missing folder: {ARTICLES_DIR}")

    pdfs = sorted(ARTICLES_DIR.rglob("*.pdf"), key=lambda p: str(p).lower())
    for pdf in pdfs:
        rel_from_root = pdf.relative_to(ROOT).as_posix()
        item = phase2.get(rel_from_root)
        title = pick_article_title(rel_from_root, item, pdf.name)
        journal = (item or {}).get("journal_or_issuer") or ""
        year = (item or {}).get("year") or ""
        parent_rel = pdf.parent.relative_to(ARTICLES_DIR).as_posix()
        if parent_rel == ".":
            parent_rel = ""

        new_name = sanitize_filename(f"{title}{AUTHOR_SUFFIX}.pdf")
        if pdf.name != new_name:
            dst = rename_file(pdf, new_name, manifest)
        else:
            dst = pdf

        if parent_rel:
            rel = f"{parent_rel}/{dst.name}"
        else:
            rel = dst.name

        entries.append({
            "id": uid("article"),
            "titleAr": title,
            "journal": journal.strip(),
            "year": str(year).strip() if year else "",
            "pdf": {"url": media_url("articles", rel), "filename": dst.name},
        })

    entries.sort(key=lambda a: (a.get("journal", ""), a["titleAr"]))
    return entries


def scan_awards(manifest: list) -> list[dict]:
    entries = []
    if not AWARDS_DIR.is_dir():
        raise SystemExit(f"Missing folder: {AWARDS_DIR}")

    files = []
    for path in AWARDS_DIR.rglob("*"):
        if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".pdf"}:
            files.append(path)
    files.sort(key=lambda p: str(p).lower())

    for path in files:
        rel = path.relative_to(AWARDS_DIR).as_posix()
        parent = path.parent.name if path.parent != AWARDS_DIR else ""
        stem = path.stem
        if path.name == "3.jpg" or (stem == "3" and path.parent == AWARDS_DIR):
            name = "Award Certificate 001"
        elif stem == "file":
            name = "Award Certificate"
        else:
            name = stem

        body = parent or "جوائز وتكريمات أكاديمية"

        entry = {
            "id": uid("award"),
            "nameAr": name,
            "body": body,
            "year": "",
            "image": None,
            "pdf": None,
        }

        ext = path.suffix.lower()
        url = media_url("awards", rel)
        if ext == ".pdf":
            entry["pdf"] = {"url": url, "filename": path.name}
        else:
            entry["image"] = url

        entries.append(entry)

    return entries


def setup_cv(manifest: list) -> dict:
    cv_sources = list(ROOT.glob("C.V*.pdf")) + list(ROOT.glob("c.v*.pdf"))
    if not cv_sources:
        raise SystemExit("CV PDF not found at project root")
    src = cv_sources[0]
    CV_DIR.mkdir(parents=True, exist_ok=True)
    dst = CV_DIR / sanitize_filename(CV_FILENAME)
    for old_cv in CV_DIR.glob("*.pdf"):
        if old_cv != dst:
            old_cv.unlink()
            manifest.append({"action": "remove_old_cv", "path": str(old_cv.relative_to(ROOT))})
    if not dst.exists() or dst.stat().st_size != src.stat().st_size:
        shutil.copy2(src, dst)
        manifest.append({"action": "copy_cv", "from": src.name, "to": str(dst.relative_to(ROOT))})
    return {
        "url": media_url("cv", dst.name),
        "filename": dst.name,
    }


def build_content(books, articles, awards, cv_pdf, old: dict) -> dict:
    return {
        "home": old.get("home", {}),
        "profile": {
            **old.get("profile", {}),
            "cvPdf": cv_pdf,
        },
        "publications": {
            "sectionTitleAr": "المنشورات العلمية",
            "sectionTitleEn": "Publications",
            "booksTitleAr": "الكتب",
            "booksTitleEn": "Books",
            "articlesTitleAr": "المقالات العلمية",
            "articlesTitleEn": "Academic Articles",
            "books": books,
            "articles": articles,
        },
        "awards": {
            "sectionTitleAr": "الجوائز والتكريمات",
            "sectionTitleEn": "Awards & Recognition",
            "awardsTitleAr": "الجوائز والشهادات",
            "awardsTitleEn": "Awards & Certificates",
            "items": awards,
        },
        "contact": old.get("contact", {
            "sectionTitleAr": "تواصل معنا",
            "sectionTitleEn": "Contact Us",
        }),
    }


def main():
    print("Phase 3: renaming assets and rebuilding content.json\n")
    manifest: list = []
    phase2 = load_phase2()

    old = {}
    if CONTENT_FILE.exists():
        old = json.loads(CONTENT_FILE.read_text(encoding="utf-8"))

    print("Renaming books...")
    books = rename_books(manifest)
    print(f"  {len(books)} books")

    print("Renaming articles...")
    articles = rename_articles(phase2, manifest)
    print(f"  {len(articles)} articles")

    print("Scanning awards...")
    awards = scan_awards(manifest)
    print(f"  {len(awards)} award files")

    print("Setting up CV...")
    cv_pdf = setup_cv(manifest)

    content = build_content(books, articles, awards, cv_pdf, old)
    CONTENT_FILE.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
    MANIFEST_FILE.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    renames = sum(1 for m in manifest if m.get("action") == "rename")
    print(f"\nDone: {renames} renames, content.json updated.")
    print(f"Manifest: {MANIFEST_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
