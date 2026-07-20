import React, { useRef } from 'react';
import EditableText from './EditableText';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { uploadFile, uid } from '../utils/api';

function ConferenceCard({ item, onUpdate, onRemove }) {
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
    <article className="conf-card">
      <div className="conf-year">{item.year}</div>
      <div className="conf-body">
        <EditableText
          tag="h4"
          className="conf-name-ar"
          dir="rtl"
          lang="ar"
          value={item.nameAr}
          onChange={(v) => onUpdate({ ...item, nameAr: v })}
        />
        <EditableText
          tag="p"
          className="conf-name-en"
          dir="ltr"
          lang="en"
          value={item.nameEn || ''}
          onChange={(v) => onUpdate({ ...item, nameEn: v })}
        />
        <EditableText
          tag="p"
          className="conf-location"
          dir="ltr"
          value={item.location || ''}
          onChange={(v) => onUpdate({ ...item, location: v })}
        />
        {item.paperTitle && (
          <EditableText
            tag="p"
            className="conf-paper"
            dir="rtl"
            lang="ar"
            value={item.paperTitle}
            onChange={(v) => onUpdate({ ...item, paperTitle: v })}
          />
        )}
        {item.pdf?.url && (
          <a href={item.pdf.url} className="btn-outline-gold btn-sm" target="_blank" rel="noopener noreferrer">
            Download Paper
          </a>
        )}
        {isEditor && (
          <div className="conf-edit-actions">
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

export default function ConferencesSection({ data }) {
  const { isEditor } = useAuth();
  const { updateContent } = useContent();

  const updateField = (field, value) => {
    updateContent((prev) => ({
      ...prev,
      conferences: { ...prev.conferences, [field]: value }
    }));
  };

  const updateItem = (index, item) => {
    updateContent((prev) => {
      const items = [...prev.conferences.items];
      items[index] = item;
      return { ...prev, conferences: { ...prev.conferences, items } };
    });
  };

  const addItem = () => {
    updateContent((prev) => ({
      ...prev,
      conferences: {
        ...prev.conferences,
        items: [...prev.conferences.items, {
          id: uid(),
          nameAr: 'اسم المؤتمر',
          nameEn: 'Conference Name',
          location: 'Location',
          year: '2024',
          paperTitle: '',
          pdf: null
        }]
      }
    }));
  };

  const removeItem = (index) => {
    updateContent((prev) => ({
      ...prev,
      conferences: {
        ...prev.conferences,
        items: prev.conferences.items.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <section id="conferences" className="section section-conferences">
      <div className="section-header">
        <EditableText
          tag="h2"
          className="section-title-ar"
          dir="rtl"
          lang="ar"
          value={data.sectionTitleAr}
          onChange={(v) => updateField('sectionTitleAr', v)}
        />
        <EditableText
          tag="p"
          className="section-title-en"
          dir="ltr"
          lang="en"
          value={data.sectionTitleEn}
          onChange={(v) => updateField('sectionTitleEn', v)}
        />
      </div>

      <div className="conf-timeline">
        {data.items.map((item, i) => (
          <ConferenceCard
            key={item.id}
            item={item}
            onUpdate={(updated) => updateItem(i, updated)}
            onRemove={() => removeItem(i)}
          />
        ))}
        {data.items.length === 0 && !isEditor && (
          <p className="empty-state" dir="rtl" lang="ar">لا توجد مؤتمرات مسجلة حتى الآن.</p>
        )}
      </div>

      {isEditor && (
        <button type="button" className="btn-add" onClick={addItem}>+ Add Conference</button>
      )}
    </section>
  );
}
