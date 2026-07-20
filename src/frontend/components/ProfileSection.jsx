import React, { useRef } from 'react';
import EditableText from './EditableText';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { uploadFile } from '../utils/api';

export default function ProfileSection({ data }) {
  const { isEditor } = useAuth();
  const { updateContent, showToast } = useContent();
  const cvInputRef = useRef(null);

  const updateProfile = (field, value) => {
    updateContent((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  const handleCvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile('pdfs', file);
      updateProfile('cvPdf', { url: result.url, filename: result.filename });
      showToast('CV uploaded — click Save to persist');
    } catch (err) {
      showToast(err.message, true);
    }
    e.target.value = '';
  };

  return (
    <section id="profile" className="section section-profile">
      <div className="section-header">
        <EditableText
          tag="h2"
          className="section-title-ar"
          dir="rtl"
          lang="ar"
          value={data.sectionTitleAr}
          onChange={(v) => updateProfile('sectionTitleAr', v)}
        />
        <EditableText
          tag="p"
          className="section-title-en"
          dir="ltr"
          lang="en"
          value={data.sectionTitleEn}
          onChange={(v) => updateProfile('sectionTitleEn', v)}
        />
      </div>

      <div className="profile-bio" dir="rtl" lang="ar">
        <EditableText
          className="bio-text"
          dir="rtl"
          lang="ar"
          value={data.biographyAr}
          onChange={(v) => updateProfile('biographyAr', v)}
        />
      </div>

      <div className="cv-download-wrap">
        {data.cvPdf?.url ? (
          <a href={data.cvPdf.url} className="btn-gold btn-cv" target="_blank" rel="noopener noreferrer">
            <EditableText
              tag="span"
              dir="rtl"
              lang="ar"
              value={data.cvLabelAr}
              onChange={(v) => updateProfile('cvLabelAr', v)}
            />
            {' / '}
            <EditableText
              tag="span"
              dir="ltr"
              lang="en"
              value={data.cvLabelEn}
              onChange={(v) => updateProfile('cvLabelEn', v)}
            />
          </a>
        ) : (
          <span className="btn-gold btn-cv disabled">
            {data.cvLabelAr} / {data.cvLabelEn}
          </span>
        )}
        {isEditor && (
          <div className="edit-only-inline">
            <button type="button" className="btn-outline-gold" onClick={() => cvInputRef.current?.click()}>
              Upload CV (PDF)
            </button>
            {data.cvPdf && (
              <button type="button" className="btn-outline-danger" onClick={() => updateProfile('cvPdf', null)}>
                Remove CV
              </button>
            )}
            <input ref={cvInputRef} type="file" accept=".pdf" hidden onChange={handleCvUpload} />
          </div>
        )}
      </div>
    </section>
  );
}
