import React, { useState, useRef } from 'react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { uploadFile, uid } from '../utils/api';

function PublicationCard({ item, type, onUpdate, onRemove }) {
  const { isEditor } = useAuth();
  const { showToast } = useContent();
  const coverRef = useRef(null);
  const pdfRef = useRef(null);

  const handleCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile('images', file);
      onUpdate({ ...item, coverImage: result.url });
      showToast('Cover updated — click Save to persist');
    } catch (err) {
      showToast(err.message, true);
    }
    e.target.value = '';
  };

  const handlePdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile('pdfs', file);
      onUpdate({ ...item, pdf: { url: result.url, filename: result.filename } });
      showToast('PDF uploaded — click Save to persist');
    } catch (err) {
      showToast(err.message, true);
    }
    e.target.value = '';
  };

  return (
    <article className="pub-card">
      <div className="pub-cover">
        {item.coverImage ? (
          <EditableImage
            src={item.coverImage}
            alt={item.titleAr}
            onReplace={(url) => onUpdate({ ...item, coverImage: url })}
            onRemove={() => onUpdate({ ...item, coverImage: null })}
          />
        ) : (
          <div className="pub-cover-placeholder">📚</div>
        )}
        {isEditor && !item.coverImage && (
          <button type="button" className="edit-only-btn" onClick={() => coverRef.current?.click()}>
            + Cover
          </button>
        )}
        <input ref={coverRef} type="file" accept="image/*" hidden onChange={handleCover} />
      </div>
      <div className="pub-body" dir="rtl" lang="ar">
        <EditableText
          tag="h4"
          className="pub-title"
          dir="rtl"
          lang="ar"
          value={item.titleAr}
          onChange={(v) => onUpdate({ ...item, titleAr: v })}
        />
        {type === 'articles' && (
          <EditableText
            tag="p"
            className="pub-journal"
            dir="rtl"
            lang="ar"
            value={item.journal || ''}
            onChange={(v) => onUpdate({ ...item, journal: v })}
          />
        )}
        <EditableText
          tag="p"
          className="pub-year"
          dir="ltr"
          value={item.year || ''}
          onChange={(v) => onUpdate({ ...item, year: v })}
        />
        {item.pdf?.url && (
          <a href={item.pdf.url} className="btn-outline-gold btn-sm" target="_blank" rel="noopener noreferrer">
            Download / View
          </a>
        )}
        {isEditor && (
          <div className="pub-edit-actions">
            <button type="button" className="btn-outline-gold btn-sm" onClick={() => pdfRef.current?.click()}>
              {item.pdf ? 'Replace PDF' : 'Upload PDF'}
            </button>
            <button type="button" className="btn-outline-danger btn-sm" onClick={onRemove}>Remove</button>
            <input ref={pdfRef} type="file" accept=".pdf" hidden onChange={handlePdf} />
          </div>
        )}
      </div>
    </article>
  );
}

export default function PublicationsSection({ data }) {
  const { isEditor } = useAuth();
  const { updateContent } = useContent();
  const [tab, setTab] = useState('books');

  const updatePub = (field, value) => {
    updateContent((prev) => ({
      ...prev,
      publications: { ...prev.publications, [field]: value }
    }));
  };

  const updateItem = (type, index, item) => {
    updateContent((prev) => {
      const list = [...prev.publications[type]];
      list[index] = item;
      return { ...prev, publications: { ...prev.publications, [type]: list } };
    });
  };

  const removeItem = (type, index) => {
    updateContent((prev) => ({
      ...prev,
      publications: {
        ...prev.publications,
        [type]: prev.publications[type].filter((_, i) => i !== index)
      }
    }));
  };

  const addItem = (type) => {
    const newItem = type === 'books'
      ? { id: uid(), titleAr: 'عنوان الكتاب', year: '2024', coverImage: null, pdf: null }
      : { id: uid(), titleAr: 'عنوان المقال', journal: 'اسم المجلة', year: '2024', coverImage: null, pdf: null };
    updateContent((prev) => ({
      ...prev,
      publications: {
        ...prev.publications,
        [type]: [...prev.publications[type], newItem]
      }
    }));
  };

  const items = tab === 'books' ? data.books : data.articles;

  return (
    <section id="publications" className="section section-publications">
      <div className="section-header">
        <EditableText
          tag="h2"
          className="section-title-ar"
          dir="rtl"
          lang="ar"
          value={data.sectionTitleAr}
          onChange={(v) => updatePub('sectionTitleAr', v)}
        />
        <EditableText
          tag="p"
          className="section-title-en"
          dir="ltr"
          lang="en"
          value={data.sectionTitleEn}
          onChange={(v) => updatePub('sectionTitleEn', v)}
        />
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab-btn ${tab === 'books' ? 'active' : ''}`}
          onClick={() => setTab('books')}
        >
          <span dir="rtl" lang="ar">{data.booksTitleAr}</span>
          <span>{data.booksTitleEn}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'articles' ? 'active' : ''}`}
          onClick={() => setTab('articles')}
        >
          <span dir="rtl" lang="ar">{data.articlesTitleAr}</span>
          <span>{data.articlesTitleEn}</span>
        </button>
      </div>

      <div className="card-grid">
        {items.map((item, i) => (
          <PublicationCard
            key={item.id}
            item={item}
            type={tab}
            onUpdate={(updated) => updateItem(tab, i, updated)}
            onRemove={() => removeItem(tab, i)}
          />
        ))}
        {items.length === 0 && !isEditor && (
          <p className="empty-state" dir="rtl" lang="ar">لا توجد منشورات حتى الآن.</p>
        )}
      </div>

      {isEditor && (
        <button type="button" className="btn-add" onClick={() => addItem(tab)}>
          + Add {tab === 'books' ? 'Book' : 'Article'}
        </button>
      )}
    </section>
  );
}
