import React, { useRef } from 'react';
import EditableText from './EditableText';
import DriveFolderBanner from './DriveFolderBanner';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { uploadFile, uid } from '../utils/api';
import { resolvePdfOrFolderUrl, resolveSectionFolderUrl } from '../utils/driveUrls';

function ConferenceCard({ item, onUpdate, onRemove, folderUrl, driveAssets }) {
  const { isEditor } = useAuth();
  const { showToast } = useContent();
  const pdfRef = useRef(null);
  const { url: linkUrl, isDirectFile } = resolvePdfOrFolderUrl(item.pdf, folderUrl, driveAssets);

  const handlePdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile('pdfs', file);
      onUpdate({
        ...item,
        pdf: { driveFileId: '', url: result.url, filename: result.filename }
      });
      showToast('PDF uploaded — click Save to persist');
    } catch (err) {
      showToast(err.message, true);
    }
    e.target.value = '';
  };

  return (
    <article className="conf-card">
      <div className="conf-timeline-marker" aria-hidden="true">
        <span className="conf-dot" />
      </div>
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
        <EditableText
          tag="p"
          className="conf-paper"
          dir="rtl"
          lang="ar"
          value={item.paperTitle || ''}
          onChange={(v) => onUpdate({ ...item, paperTitle: v })}
        />
        <a href={linkUrl} className="btn-outline-gold btn-sm" target="_blank" rel="noopener noreferrer">
          {isDirectFile ? 'Download Paper' : 'Browse on Google Drive'}
        </a>
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

export default function ConferencesSection({ data, driveAssets }) {
  const { isEditor } = useAuth();
  const { updateContent } = useContent();
  const folderUrl = resolveSectionFolderUrl(driveAssets, 'conferences');
  const items = data?.items ?? [];

  const updateField = (field, value) => {
    updateContent((prev) => ({
      ...prev,
      conferences: { ...prev.conferences, [field]: value }
    }));
  };

  const updateItem = (index, item) => {
    updateContent((prev) => {
      const nextItems = [...prev.conferences.items];
      nextItems[index] = item;
      return { ...prev, conferences: { ...prev.conferences, items: nextItems } };
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
          pdf: { driveFileId: '', filename: '' }
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

      <DriveFolderBanner
        driveAssets={driveAssets}
        sectionKey="conferences"
        labelAr="أوراق المؤتمرات على Google Drive"
        labelEn="Conference papers are on Google Drive"
      />

      <div className="conf-timeline">
        {items.map((item, i) => (
          <ConferenceCard
            key={item.id || `conf-${i}`}
            item={item}
            folderUrl={folderUrl}
            driveAssets={driveAssets}
            onUpdate={(updated) => updateItem(i, updated)}
            onRemove={() => removeItem(i)}
          />
        ))}
        {items.length === 0 && !isEditor && (
          <p className="empty-state" dir="rtl" lang="ar">لا توجد مؤتمرات مسجلة حتى الآن.</p>
        )}
      </div>

      {isEditor && (
        <button type="button" className="btn-add" onClick={addItem}>+ Add Conference</button>
      )}
    </section>
  );
}
