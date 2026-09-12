"""PDF/image helpers for content population."""
import os
import re
import shutil
import json
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'content-library')


def slugify(name, max_len=80):
    base = os.path.splitext(os.path.basename(name))[0]
    base = re.sub(r'[^\w\u0600-\u06FF\-]+', '-', base, flags=re.UNICODE)
    base = re.sub(r'-+', '-', base).strip('-')
    return base[:max_len] or 'item'


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)
    return path


def copy_file(src, dest_dir, dest_name=None):
    ensure_dir(dest_dir)
    name = dest_name or os.path.basename(src)
    dest = os.path.join(dest_dir, name)
    shutil.copy2(src, dest)
    return dest


def web_path(abs_path):
    rel = os.path.relpath(abs_path, ROOT).replace('\\', '/')
    return '/' + rel


def extract_pdf_text(path, max_pages=3):
    try:
        doc = pymupdf.open(path)
        parts = []
        for i in range(min(max_pages, len(doc))):
            t = doc[i].get_text().strip()
            if t:
                parts.append(t)
        doc.close()
        return '\n'.join(parts)
    except Exception as e:
        print(f'  [skip text] {path}: {e}')
        return ''


def render_pdf_page(path, page_index, out_path, scale=2.0):
    try:
        doc = pymupdf.open(path)
        if page_index >= len(doc):
            page_index = 0
        page = doc[page_index]
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale))
        ensure_dir(os.path.dirname(out_path))
        pix.save(out_path)
        doc.close()
        return True
    except Exception as e:
        print(f'  [skip render] {path}: {e}')
        return False


def title_from_filename(path):
    base = os.path.splitext(os.path.basename(path))[0]
    return base.strip()


def journal_from_parent(path, root_folder):
    parent = os.path.basename(os.path.dirname(path))
    if parent and parent != os.path.basename(root_folder):
        return parent
    return ''


def year_from_text(text):
    matches = re.findall(r'\b(19|20)\d{2}\b', text or '')
    return matches[-1] if matches else ''


def is_image(path):
    return os.path.splitext(path)[1].lower() in {'.jpg', '.jpeg', '.png', '.gif', '.webp'}


def walk_files(folder, extensions=None):
    if not os.path.isdir(folder):
        return []
    results = []
    for dirpath, _, files in os.walk(folder):
        for f in files:
            if f.startswith('.'):
                continue
            full = os.path.join(dirpath, f)
            if extensions:
                ext = os.path.splitext(f)[1].lower()
                if ext not in extensions:
                    continue
            results.append(full)
    return sorted(results)


def pick_title(text, fallback):
    if not text:
        return fallback
    lines = [l.strip() for l in re.split(r'[\r\n]+', text) if l.strip()]
    skip = ('الدكتور', 'نصر', 'أستاذ', 'جامعة', 'ISBN', 'ISSN', 'مركز', 'نشر', 'طبعة')
    candidates = []
    for line in lines:
        if any(s in line for s in skip):
            continue
        if len(line) < 8:
            continue
        if re.search(r'[\u0600-\u06FF]', line):
            candidates.append(line)
    if candidates:
        return candidates[0]
    return fallback
