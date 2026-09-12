import React, { useState, useRef } from 'react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { uploadFile, uid } from '../utils/api';

function BookCard({ item, onUpdate, onRemove }) {
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
    <article className="book-card">
      <div className="book-cover">
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
      <div className="book-body" dir="rtl" lang="ar">
        <EditableText
          tag="h4"
          className="book-title"
          dir="rtl"
          lang="ar"
          value={item.titleAr}
          onChange={(v) => onUpdate({ ...item, titleAr: v })}
        />
        <p className="book-author" dir="rtl" lang="ar">{item.authorAr || 'أ.د. نصر الدين إبراهيم أحمد حسين'}</p>
        {item.year && <p className="book-year" dir="ltr">{item.year}</p>}
        {item.pdf?.url && (
          <a href={item.pdf.url} className="btn-outline-gold btn-sm" target="_blank" rel="noopener noreferrer">
            View / Download
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

function ArticleListCard({ item, onUpdate, onRemove }) {
  const { isEditor } = useAuth();
  const { showToast } = useContent();
  const pdfRef = useRef(null);

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
    <article className="article-list-card">
      <div className="article-list-icon" aria-hidden="true">📄</div>
      <div className="article-list-body" dir="rtl" lang="ar">
        <EditableText
          tag="h4"
          className="article-list-title"
          dir="rtl"
          lang="ar"
          value={item.titleAr}
          onChange={(v) => onUpdate({ ...item, titleAr: v })}
        />
        {item.journal && (
          <EditableText
            tag="p"
            className="article-list-journal"
            dir="rtl"
            lang="ar"
            value={item.journal}
            onChange={(v) => onUpdate({ ...item, journal: v })}
          />
        )}
        {item.year && (
          <EditableText
            tag="p"
            className="article-list-year"
            dir="ltr"
            value={item.year}
            onChange={(v) => onUpdate({ ...item, year: v })}
          />
        )}
      </div>
      <div className="article-list-action">
        {item.pdf?.url && (
          <a href={item.pdf.url} className="btn-outline-gold btn-sm" target="_blank" rel="noopener noreferrer">
            Download Article
          </a>
        )}
        {isEditor && (
          <div className="pub-edit-actions vertical">
            <button type="button" className="btn-outline-gold btn-sm" onClick={() => pdfRef.current?.click()}>
              {item.pdf ? 'Replace' : 'Upload'}
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
      const list = [...(prev.publications[type] || [])];
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
    const templates = {
      books: { titleAr: 'عنوان الكتاب', authorAr: 'أ.د. نصر الدين إبراهيم أحمد حسين', year: '', coverImage: null, pdf: null },
      articles: { titleAr: 'عنوان المقال', journal: 'اسم المجلة', year: '', pdf: null },
      research: { titleAr: 'عنوان البحث', journal: '', year: '', pdf: null }
    };
    updateContent((prev) => ({
      ...prev,
      publications: {
        ...prev.publications,
        [type]: [...(prev.publications[type] || []), { id: uid(), ...templates[type] }]
      }
    }));
  };

  const items = data[tab] || [];

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
        <button type="button" className={`tab-btn ${tab === 'books' ? 'active' : ''}`} onClick={() => setTab('books')}>
          <span dir="rtl" lang="ar">{data.booksTitleAr}</span>
          <span>{data.booksTitleEn}</span>
        </button>
        <button type="button" className={`tab-btn ${tab === 'articles' ? 'active' : ''}`} onClick={() => setTab('articles')}>
          <span dir="rtl" lang="ar">{data.articlesTitleAr}</span>
          <span>{data.articlesTitleEn}</span>
        </button>
        <button type="button" className={`tab-btn ${tab === 'research' ? 'active' : ''}`} onClick={() => setTab('research')}>
          <span dir="rtl" lang="ar">{data.researchTitleAr || 'البحوث'}</span>
          <span>{data.researchTitleEn || 'Research'}</span>
        </button>
      </div>

      {tab === 'books' ? (
        <div className="books-grid">
          {items.map((item, i) => (
            <BookCard
              key={item.id}
              item={item}
              onUpdate={(updated) => updateItem('books', i, updated)}
              onRemove={() => removeItem('books', i)}
            />
          ))}
        </div>
      ) : (
        <div className="articles-list">
          {items.map((item, i) => (
            <ArticleListCard
              key={item.id}
              item={item}
              onUpdate={(updated) => updateItem(tab, i, updated)}
              onRemove={() => removeItem(tab, i)}
            />
          ))}
        </div>
      )}

      {isEditor && (
        <button type="button" className="btn-add" onClick={() => addItem(tab)}>
          + Add {tab === 'books' ? 'Book' : tab === 'articles' ? 'Article' : 'Research'}
        </button>
      )}
    </section>
  );
}
