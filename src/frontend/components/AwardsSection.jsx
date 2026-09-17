import React, { useRef } from 'react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { uploadFile, uid } from '../utils/api';

export default function AwardsSection({ data }) {
  const { isEditor } = useAuth();
  const { updateContent, showToast } = useContent();
  const awardImageRef = useRef(null);
  const awards = data?.items ?? [];

  const updateField = (field, value) => {
    updateContent((prev) => ({
      ...prev,
      awards: { ...prev.awards, [field]: value }
    }));
  };

  const updateAward = (index, award) => {
    updateContent((prev) => {
      const nextAwards = [...prev.awards.items];
      nextAwards[index] = award;
      return { ...prev, awards: { ...prev.awards, items: nextAwards } };
    });
  };

  const removeAward = (index) => {
    updateContent((prev) => ({
      ...prev,
      awards: {
        ...prev.awards,
        items: prev.awards.items.filter((_, i) => i !== index)
      }
    }));
  };

  const addAward = () => {
    updateContent((prev) => ({
      ...prev,
      awards: {
        ...prev.awards,
        items: [...prev.awards.items, {
          id: uid(),
          nameAr: 'اسم الجائزة',
          body: 'الجهة المانحة',
          year: '2024',
          image: null,
          pdf: null
        }]
      }
    }));
  };

  return (
    <section id="awards" className="section section-awards">
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

      <div className="awards-grid awards-grid-2col">
        {awards.map((award, i) => (
          <article key={award.id || `award-${i}`} className="award-card award-card-gold">
            {award.image ? (
              <div className="award-image-wrap">
                <EditableImage
                  src={award.image}
                  alt={award.nameAr}
                  onReplace={(url) => updateAward(i, { ...award, image: url })}
                  onRemove={() => updateAward(i, { ...award, image: null })}
                />
              </div>
            ) : award.pdf?.url ? (
              <div className="award-pdf-preview">
                <span className="award-pdf-icon" aria-hidden="true">📄</span>
                <a href={award.pdf.url} className="btn-outline-gold btn-sm" target="_blank" rel="noopener noreferrer">
                  View Certificate
                </a>
              </div>
            ) : (
              <div className="award-image-placeholder">🏆</div>
            )}
            <div className="award-card-body" dir="rtl" lang="ar">
              <EditableText
                tag="h4"
                className="award-name"
                dir="rtl"
                lang="ar"
                value={award.nameAr}
                onChange={(v) => updateAward(i, { ...award, nameAr: v })}
              />
              <EditableText
                tag="p"
                className="award-body"
                dir="rtl"
                lang="ar"
                value={award.body}
                onChange={(v) => updateAward(i, { ...award, body: v })}
              />
              {award.year && (
                <EditableText
                  tag="p"
                  className="award-year"
                  dir="ltr"
                  value={award.year}
                  onChange={(v) => updateAward(i, { ...award, year: v })}
                />
              )}
            </div>
            {isEditor && (
              <div className="award-edit-actions">
                {!award.image && (
                  <button
                    type="button"
                    className="btn-outline-gold btn-sm"
                    onClick={() => {
                      awardImageRef.current.dataset.index = i;
                      awardImageRef.current.click();
                    }}
                  >
                    Add Image
                  </button>
                )}
                <button type="button" className="btn-outline-danger btn-sm" onClick={() => removeAward(i)}>
                  Remove
                </button>
              </div>
            )}
          </article>
        ))}
        {awards.length === 0 && !isEditor && (
          <p className="empty-state" dir="rtl" lang="ar">لا توجد جوائز مسجلة حتى الآن.</p>
        )}
      </div>

      {isEditor && (
        <button type="button" className="btn-add" onClick={addAward}>+ Add Award</button>
      )}

      <input
        ref={awardImageRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          const index = parseInt(e.target.dataset.index, 10);
          if (!file || Number.isNaN(index)) return;
          try {
            const result = await uploadFile('images', file);
            updateAward(index, { ...awards[index], image: result.url });
            showToast('Image added — click Save to persist');
          } catch (err) {
            showToast(err.message, true);
          }
          e.target.value = '';
        }}
      />
    </section>
  );
}
