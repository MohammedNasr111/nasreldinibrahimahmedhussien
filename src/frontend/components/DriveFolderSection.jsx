import React from 'react';
import EditableText from './EditableText';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';

/**
 * Simple section with a card linking to a Google Drive folder (no per-file hosting).
 * Used for Research and Conferences content kept off Vercel Blob.
 */
export default function DriveFolderSection({ data, sectionId, contentKey }) {
  const { isEditor } = useAuth();
  const { updateContent } = useContent();

  const updateField = (field, value) => {
    updateContent((prev) => ({
      ...prev,
      [contentKey]: { ...prev[contentKey], [field]: value }
    }));
  };

  const folderUrl = data?.driveFolderUrl?.trim() || '';

  return (
    <section id={sectionId} className={`section section-${sectionId}`}>
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

      <div className="drive-link-card">
        <span className="drive-link-card-icon" aria-hidden="true">📁</span>
        <EditableText
          tag="h3"
          className="drive-link-card-title-ar"
          dir="rtl"
          lang="ar"
          value={data.cardTitleAr}
          onChange={(v) => updateField('cardTitleAr', v)}
        />
        <EditableText
          tag="p"
          className="drive-link-card-title-en"
          dir="ltr"
          lang="en"
          value={data.cardTitleEn}
          onChange={(v) => updateField('cardTitleEn', v)}
        />
        {(data.descriptionAr || isEditor) && (
          <EditableText
            tag="p"
            className="drive-link-card-desc"
            dir="rtl"
            lang="ar"
            value={data.descriptionAr || ''}
            onChange={(v) => updateField('descriptionAr', v)}
          />
        )}
        {(data.descriptionEn || isEditor) && (
          <EditableText
            tag="p"
            className="drive-link-card-desc-en"
            dir="ltr"
            lang="en"
            value={data.descriptionEn || ''}
            onChange={(v) => updateField('descriptionEn', v)}
          />
        )}

        {isEditor && (
          <label className="drive-link-url-edit">
            <span>Google Drive folder URL</span>
            <input
              type="url"
              value={folderUrl}
              onChange={(e) => updateField('driveFolderUrl', e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
            />
          </label>
        )}

        {isEditor && (
          <div className="drive-link-edit-labels">
            <EditableText
              tag="p"
              dir="rtl"
              lang="ar"
              value={data.buttonLabelAr || 'فتح مجلد Google Drive'}
              onChange={(v) => updateField('buttonLabelAr', v)}
            />
            <EditableText
              tag="p"
              dir="ltr"
              lang="en"
              value={data.buttonLabelEn || 'Open Google Drive Folder'}
              onChange={(v) => updateField('buttonLabelEn', v)}
            />
          </div>
        )}

        {folderUrl ? (
          <a
            href={folderUrl}
            className="btn-gold drive-link-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span dir="rtl" lang="ar">{data.buttonLabelAr || 'فتح مجلد Google Drive'}</span>
            <span dir="ltr" lang="en">{data.buttonLabelEn || 'Open Google Drive Folder'}</span>
          </a>
        ) : (
          <p className="empty-state" dir="ltr" lang="en">
            {isEditor ? 'Add a Google Drive folder URL above.' : 'Drive link coming soon.'}
          </p>
        )}
      </div>
    </section>
  );
}
