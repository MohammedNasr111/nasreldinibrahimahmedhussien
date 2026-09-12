#!/usr/bin/env python3
"""Populate content.json from project folders."""
import json
import os
import re
import shutil
import subprocess
import sys
import time
import random

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'content-library')
CONTENT_FILE = os.path.join(ROOT, 'content.json')
AUTHOR_AR = 'أ.د. نصر الدين إبراهيم أحمد حسين'
AUTHOR_EN = 'Prof. Dr. Nasr El Din Ibrahim Ahmed Hussein'


def uid(prefix):
    return f"{prefix}-{int(time.time())}-{random.randint(1000,9999)}"


def web_path(abs_path):
    return '/' + os.path.relpath(abs_path, ROOT).replace('\\', '/')


def ensure_dir(p):
    os.makedirs(p, exist_ok=True)


def walk_files(folder, extensions=None):
    if not os.path.isdir(folder):
        return []
    out = []
    for dirpath, _, files in os.walk(folder):
        for f in files:
            if f.startswith('.'):
                continue
            full = os.path.join(dirpath, f)
            if extensions and os.path.splitext(f)[1].lower() not in extensions:
                continue
            out.append(full)
    return sorted(out)


def title_from_filename(path):
    return os.path.splitext(os.path.basename(path))[0].strip()


def journal_from_parent(path, root_folder):
    parent = os.path.basename(os.path.dirname(path))
    if parent and parent != os.path.basename(root_folder):
        return parent
    return ''


def year_from_text(text):
    matches = re.findall(r'\b(19|20)\d{2}\b', text or '')
    return matches[-1] if matches else ''


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
        print(f'  [skip text] {os.path.basename(path)}: {e}')
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
        print(f'  [skip render] {os.path.basename(path)}: {e}')
        return False


def pick_title(text, fallback):
    if not text:
        return fallback
    lines = [l.strip() for l in re.split(r'[\r\n]+', text) if l.strip()]
    skip = ('الدكتور', 'نصر', 'أستاذ', 'جامعة', 'ISBN', 'ISSN', 'مركز', 'نشر', 'طبعة', 'كلية')
    for line in lines:
        if len(line) < 8:
            continue
        if any(s in line for s in skip):
            continue
        if re.search(r'[\u0600-\u06FF]', line):
            return line
    return fallback


def ocr_book_title(image_path):
    script = os.path.join(ROOT, 'scripts', 'ocr-book-title.mjs')
    try:
        r = subprocess.run(
            ['node', script, image_path],
            capture_output=True, text=True, encoding='utf-8', cwd=ROOT, timeout=120
        )
        return (r.stdout or '').strip()
    except Exception as e:
        print(f'  [ocr fail] {e}')
        return ''


def escape_html(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def build_qualifications(text):
    m = re.search(r'ACADEMIC QUALIFICATIONS:[\s\S]*?AREA OF SPECIALIZATION:', text)
    if not m:
        return ''
    block = m.group(0).replace('AREA OF SPECIALIZATION:', '')
    items = [l.strip() for l in block.split('\n') if l.strip() and 'QUALIFICATIONS' not in l and 'الشهادات' not in l]
    return '<ul class="profile-timeline">' + ''.join(f'<li>{escape_html(i)}</li>' for i in items) + '</ul>'


def build_positions(text):
    m = re.search(r'ADMINISTRATIVE POSITION:[\s\S]*?PROFESSIONAL MEMBERSHIP', text)
    if not m:
        return ''
    items = [l.strip() for l in m.group(0).split('\n') if len(l.strip()) > 10 and 'ADMINISTRATIVE' not in l and 'PROFESSIONAL' not in l]
    return '<ul class="profile-timeline">' + ''.join(f'<li>{escape_html(i)}</li>' for i in items[:14]) + '</ul>'


def build_research_interests(text):
    m = re.search(r'AREA OF SPECIALIZATION:[\s\S]*?ADMINISTRATIVE POSITION:', text)
    if not m:
        return []
    return [l.strip() for l in m.group(0).split('\n') if l.strip() and 'SPECIALIZATION' not in l and 'مجال' not in l and len(l.strip()) > 3]


def process_books():
    folder = os.path.join(ROOT, 'books in the website')
    books = []
    for i, src in enumerate(walk_files(folder, ['.pdf'])):
        id_str = str(i + 1).zfill(2)
        dest_dir = os.path.join(OUT, 'books', id_str)
        ensure_dir(dest_dir)
        pdf_dest = os.path.join(dest_dir, 'book.pdf')
        shutil.copy2(src, pdf_dest)

        cover_path = os.path.join(dest_dir, 'cover.png')
        render_pdf_page(src, 1, cover_path, 2.5)
        if not os.path.exists(cover_path) or os.path.getsize(cover_path) < 1000:
            render_pdf_page(src, 0, cover_path, 2.5)

        title = ocr_book_title(cover_path)
        if not title or len(title) < 10:
            text = extract_pdf_text(src, 3)
            title = pick_title(text, title_from_filename(src))

        books.append({
            'id': uid('book'),
            'titleAr': title,
            'authorAr': AUTHOR_AR,
            'authorEn': AUTHOR_EN,
            'year': year_from_text(title) or '',
            'coverImage': web_path(cover_path),
            'pdf': {'url': web_path(pdf_dest), 'filename': os.path.basename(src)}
        })
        try:
            print(f'  Book {id_str}: {title[:70]}')
        except UnicodeEncodeError:
            print(f'  Book {id_str}: [title extracted]')
    return books


def process_pdf_list(folder, subfolder, id_prefix):
    items = []
    for i, src in enumerate(walk_files(folder, ['.pdf'])):
        id_str = str(i + 1).zfill(3)
        dest_dir = os.path.join(OUT, subfolder, id_str)
        ensure_dir(dest_dir)
        pdf_dest = os.path.join(dest_dir, 'document.pdf')
        shutil.copy2(src, pdf_dest)

        text = extract_pdf_text(src, 2)
        fallback = title_from_filename(src)
        title = pick_title(text, fallback)
        journal = journal_from_parent(src, folder)
        year = year_from_text(text or fallback)

        items.append({
            'id': uid(id_prefix),
            'titleAr': title,
            'journal': journal,
            'year': year,
            'pdf': {'url': web_path(pdf_dest), 'filename': os.path.basename(src)}
        })
    return items


def process_conferences():
    folder = os.path.join(ROOT, 'conference')
    items = []
    for i, src in enumerate(walk_files(folder, ['.pdf'])):
        id_str = str(i + 1).zfill(3)
        dest_dir = os.path.join(OUT, 'conferences', id_str)
        ensure_dir(dest_dir)
        pdf_dest = os.path.join(dest_dir, 'paper.pdf')
        shutil.copy2(src, pdf_dest)

        text = extract_pdf_text(src, 2)
        fallback = title_from_filename(src)
        title = pick_title(text, fallback)
        parent = journal_from_parent(src, folder)

        items.append({
            'id': uid('conf'),
            'nameAr': title,
            'nameEn': '',
            'location': 'International Islamic University Malaysia' if 'IIUM' in parent or not parent else parent,
            'year': year_from_text(text or fallback) or '',
            'paperTitle': title,
            'pdf': {'url': web_path(pdf_dest), 'filename': os.path.basename(src)}
        })

    for i, src in enumerate(walk_files(folder, ['.jpg', '.jpeg', '.png'])):
        id_str = f'img-{str(i+1).zfill(2)}'
        dest_dir = os.path.join(OUT, 'conferences', id_str)
        ensure_dir(dest_dir)
        ext = os.path.splitext(src)[1]
        img_dest = os.path.join(dest_dir, f'photo{ext}')
        shutil.copy2(src, img_dest)
        items.append({
            'id': uid('conf-photo'),
            'nameAr': 'مشاركة في مؤتمر علمي',
            'nameEn': 'Conference Participation',
            'location': 'IIUM, Malaysia',
            'year': '2023',
            'paperTitle': '',
            'image': web_path(img_dest),
            'pdf': None
        })

    return sorted(items, key=lambda x: x.get('year') or '', reverse=True)


def process_awards():
    folder = os.path.join(ROOT, 'awards')
    all_files = walk_files(folder, ['.pdf', '.jpg', '.jpeg', '.png'])
    awards = []
    for i, src in enumerate(all_files):
        if 'صور تذكارية' in src.replace('\\', '/'):
            continue
        id_str = str(i + 1).zfill(3)
        dest_dir = os.path.join(OUT, 'awards', id_str)
        ensure_dir(dest_dir)
        ext = os.path.splitext(src)[1]
        dest = os.path.join(dest_dir, f'file{ext}')
        shutil.copy2(src, dest)

        parent = journal_from_parent(src, folder)
        fallback = title_from_filename(src)
        preview = web_path(dest)

        if ext.lower() == '.pdf':
            preview_path = os.path.join(dest_dir, 'preview.png')
            render_pdf_page(src, 0, preview_path, 2)
            if os.path.exists(preview_path):
                preview = web_path(preview_path)

        awards.append({
            'id': uid('award'),
            'nameAr': fallback,
            'body': parent or 'جوائز وتكريمات أكاديمية',
            'year': year_from_text(fallback) or '',
            'image': preview
        })
    return awards


def process_photos():
    folder = os.path.join(ROOT, 'awards', 'صور تذكارية')
    if not os.path.isdir(folder):
        return []
    photos = []
    for i, src in enumerate(walk_files(folder, ['.jpg', '.jpeg', '.png'])):
        id_str = str(i + 1).zfill(3)
        dest_dir = os.path.join(OUT, 'photos', id_str)
        ensure_dir(dest_dir)
        ext = os.path.splitext(src)[1]
        dest = os.path.join(dest_dir, f'photo{ext}')
        shutil.copy2(src, dest)
        photos.append({
            'id': uid('photo'),
            'url': web_path(dest),
            'caption': title_from_filename(src)
        })
    return photos


def process_cv():
    doc_path = os.path.join(ROOT, 'C.V. PROF.Nasreldin Ibrahim . English 2025 جديد.doc')
    cv_dir = os.path.join(OUT, 'cv')
    ensure_dir(cv_dir)

    pdf_path = os.path.join(cv_dir, 'cv.pdf')
    doc_dest = os.path.join(cv_dir, 'cv.doc')
    cv_text_path = os.path.join(OUT, 'cv-extract.txt')

    if os.path.exists(doc_path):
        shutil.copy2(doc_path, doc_dest)
        try:
            import win32com.client
            word = win32com.client.Dispatch('Word.Application')
            word.Visible = False
            d = word.Documents.Open(doc_path)
            d.SaveAs(pdf_path, FileFormat=17)
            d.Close(False)
            word.Quit()
            print('  CV converted to PDF')
        except Exception as e:
            print(f'  CV PDF conversion skipped: {e}')

    if not os.path.exists(cv_text_path):
        try:
            import win32com.client
            word = win32com.client.Dispatch('Word.Application')
            word.Visible = False
            d = word.Documents.Open(doc_path)
            text = d.Content.Text
            d.Close(False)
            word.Quit()
            with open(cv_text_path, 'w', encoding='utf-8') as f:
                f.write(text)
        except Exception:
            pass

    text = ''
    if os.path.exists(cv_text_path):
        with open(cv_text_path, encoding='utf-8') as f:
            text = f.read()

    cv_file = None
    if os.path.exists(pdf_path):
        cv_file = {'url': web_path(pdf_path), 'filename': 'CV-Prof-Nasr-2025.pdf'}
    elif os.path.exists(doc_dest):
        cv_file = {'url': web_path(doc_dest), 'filename': 'CV-Prof-Nasr-2025.doc'}

    return {
        'cvPdf': cv_file,
        'qualificationsHtml': build_qualifications(text),
        'positionsHtml': build_positions(text),
        'researchInterests': build_research_interests(text)
    }


def main():
    print('Populating content...\n')
    ensure_dir(OUT)

    with open(CONTENT_FILE, encoding='utf-8') as f:
        content = json.load(f)

    print('Books:')
    books = process_books()
    print(f'Academic articles ({len(walk_files(os.path.join(ROOT, "academic articles"), [".pdf"]))} files)...')
    articles = process_pdf_list(os.path.join(ROOT, 'academic articles'), 'articles', 'article')
    print(f'Research ({len(walk_files(os.path.join(ROOT, "Research"), [".pdf"]))} files)...')
    research = process_pdf_list(os.path.join(ROOT, 'Research'), 'research', 'research')
    print('Conferences...')
    conferences = process_conferences()
    print('Awards...')
    awards = process_awards()
    print('Photos...')
    photos = process_photos()
    print('CV...')
    cv = process_cv()

    content['profile'].update({
        'qualificationsHtml': cv['qualificationsHtml'],
        'qualificationsTitleAr': 'الشهادات العلمية',
        'qualificationsTitleEn': 'Academic Qualifications',
        'positionsHtml': cv['positionsHtml'],
        'positionsTitleAr': 'التعيينات والمناصب الإدارية',
        'positionsTitleEn': 'Administrative Positions',
        'researchInterests': cv['researchInterests'],
        'researchTitleAr': 'مجالات التخصص والاهتمامات البحثية',
        'researchTitleEn': 'Research Interests',
        'cvPdf': cv['cvPdf']
    })

    content['publications'].update({
        'researchTitleAr': 'البحوث',
        'researchTitleEn': 'Research',
        'books': books,
        'articles': articles,
        'research': research
    })

    content['conferences']['items'] = conferences
    content['photosAwards'].update({
        'sectionTitleAr': 'الصور والجوائز',
        'photos': photos,
        'awards': awards
    })

    content.pop('phdSupervision', None)

    with open(CONTENT_FILE, 'w', encoding='utf-8') as f:
        json.dump(content, f, ensure_ascii=False, indent=2)

    print('\nSummary:')
    print(f'  Books: {len(books)} | Articles: {len(articles)} | Research: {len(research)}')
    print(f'  Conferences: {len(conferences)} | Awards: {len(awards)} | Photos: {len(photos)}')
    print(f'  Written: {CONTENT_FILE}')


if __name__ == '__main__':
    main()
