import React, { useRef } from 'react';
import EditableText from './EditableText';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { uploadFile } from '../utils/api';
import { resolvePdfUrl, resolveSectionFolderUrl } from '../utils/driveUrls';

export default function ProfileSection({ data, driveAssets }) {
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
      updateProfile('cvPdf', { driveFileId: '', url: result.url, filename: result.filename });
      showToast('CV uploaded — click Save to persist');
    } catch (err) {
      showToast(err.message, true);
    }
    e.target.value = '';
  };

  const updateResearchInterest = (index, value) => {
    updateContent((prev) => {
      const interests = [...(prev.profile.researchInterests || [])];
      interests[index] = value;
      return { ...prev, profile: { ...prev.profile, researchInterests: interests } };
    });
  };

  const addResearchInterest = () => {
    updateContent((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        researchInterests: [...(prev.profile.researchInterests || []), 'New interest']
      }
    }));
  };

  const removeResearchInterest = (index) => {
    updateContent((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        researchInterests: prev.profile.researchInterests.filter((_, i) => i !== index)
      }
    }));
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
        {(() => {
          const cvUrl = resolvePdfUrl(data.cvPdf);
          const cvFolderUrl = resolveSectionFolderUrl(driveAssets, 'cv') || driveAssets?.rootFolderUrl;
          const href = cvUrl || cvFolderUrl;

          return href ? (
            <a href={href} className="btn-gold btn-cv" target="_blank" rel="noopener noreferrer">
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
              {!cvUrl && cvFolderUrl ? ' (Google Drive)' : ''}
            </a>
          ) : (
            <span className="btn-gold btn-cv disabled">
              {data.cvLabelAr} / {data.cvLabelEn}
            </span>
          );
        })()}
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

      {data.qualificationsHtml && (
        <div className="profile-block">
          <EditableText
            tag="h3"
            className="profile-block-title"
            dir="rtl"
            lang="ar"
            value={data.qualificationsTitleAr || 'الشهادات العلمية'}
            onChange={(v) => updateProfile('qualificationsTitleAr', v)}
          />
          <EditableText
            tag="p"
            className="profile-block-subtitle"
            dir="ltr"
            lang="en"
            value={data.qualificationsTitleEn || 'Academic Qualifications'}
            onChange={(v) => updateProfile('qualificationsTitleEn', v)}
          />
          <EditableText
            className="profile-timeline-content"
            dir="ltr"
            lang="en"
            value={data.qualificationsHtml}
            onChange={(v) => updateProfile('qualificationsHtml', v)}
          />
        </div>
      )}

      {data.positionsHtml && (
        <div className="profile-block">
          <EditableText
            tag="h3"
            className="profile-block-title"
            dir="rtl"
            lang="ar"
            value={data.positionsTitleAr || 'التعيينات والمناصب الإدارية'}
            onChange={(v) => updateProfile('positionsTitleAr', v)}
          />
          <EditableText
            tag="p"
            className="profile-block-subtitle"
            dir="ltr"
            lang="en"
            value={data.positionsTitleEn || 'Administrative Positions'}
            onChange={(v) => updateProfile('positionsTitleEn', v)}
          />
          <EditableText
            className="profile-timeline-content"
            dir="ltr"
            lang="en"
            value={data.positionsHtml}
            onChange={(v) => updateProfile('positionsHtml', v)}
          />
        </div>
      )}

      {data.researchInterests?.length > 0 && (
        <div className="profile-block">
          <EditableText
            tag="h3"
            className="profile-block-title"
            dir="rtl"
            lang="ar"
            value={data.researchTitleAr || 'مجالات التخصص والاهتمامات البحثية'}
            onChange={(v) => updateProfile('researchTitleAr', v)}
          />
          <EditableText
            tag="p"
            className="profile-block-subtitle"
            dir="ltr"
            lang="en"
            value={data.researchTitleEn || 'Research Interests'}
            onChange={(v) => updateProfile('researchTitleEn', v)}
          />
          <div className="research-tags">
            {data.researchInterests.map((interest, i) => (
              <span key={i} className="research-tag">
                {isEditor ? (
                  <>
                    <EditableText
                      tag="span"
                      dir="ltr"
                      lang="en"
                      value={interest}
                      onChange={(v) => updateResearchInterest(i, v)}
                    />
                    <button type="button" className="tag-remove" onClick={() => removeResearchInterest(i)} aria-label="Remove">×</button>
                  </>
                ) : (
                  interest
                )}
              </span>
            ))}
          </div>
          {isEditor && (
            <button type="button" className="btn-outline-gold btn-sm" onClick={addResearchInterest}>
              + Add Interest
            </button>
          )}
        </div>
      )}
    </section>
  );
}
