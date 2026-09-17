#!/usr/bin/env python3
"""Verify all /media/ URLs in content.json resolve to local files."""
import json
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content.json"

MEDIA_MAP = {
    "books": ROOT / "books in the website",
    "articles": ROOT / "academic articles",
    "awards": ROOT / "awards",
    "cv": ROOT / "site-content" / "cv",
}


def collect_urls(obj, out):
    if isinstance(obj, str) and obj.startswith("/media/"):
        out.append(obj)
    elif isinstance(obj, list):
        for item in obj:
            collect_urls(item, out)
    elif isinstance(obj, dict):
        for v in obj.values():
            collect_urls(v, out)


def resolve(url: str) -> Path | None:
    parts = url[len("/media/"):].split("/")
    category = parts[0]
    rel = unquote("/".join(parts[1:]))
    base = MEDIA_MAP.get(category)
    if not base:
        return None
    return base / rel.replace("/", "\\") if "\\" in str(base) else base / rel


def main():
    content = json.loads(CONTENT.read_text(encoding="utf-8"))
    urls = []
    collect_urls(content, urls)
    missing = []
    ok = 0
    for url in sorted(set(urls)):
        path = resolve(url)
        if path and path.is_file():
            ok += 1
        else:
            missing.append((url, str(path)))
    print(f"Media URLs: {len(set(urls))} unique, {ok} ok, {len(missing)} missing")
    for url, path in missing[:20]:
        print(f"  MISSING {url}\n    -> {path}")
    if missing:
        sys.exit(1)
    sections = {
        "books": len(content["publications"]["books"]),
        "articles": len(content["publications"]["articles"]),
        "awards": len(content["awards"]["items"]),
    }
    print("Sections:", sections)
    print("CV:", content["profile"]["cvPdf"]["filename"])
    award001 = next((a for a in content["awards"]["items"] if "3.jpg" in (a.get("image") or "")), None)
    if award001:
        print("Award 001:", award001["nameAr"])


if __name__ == "__main__":
    main()
