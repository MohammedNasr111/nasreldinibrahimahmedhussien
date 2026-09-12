import React, { useEffect, useRef, useState } from 'react';
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { uploadFile, uid } from '../utils/api';

export default function PhotosAwardsSection({ data }) {
  const { isEditor } = useAuth();
  const { updateContent, showToast } = useContent();
  const [tab, setTab] = useState('photos');
  const lightboxRef = useRef(null);
  const photoInputRef = useRef(null);
  const awardImageRef = useRef(null);

  useEffect(() => {
    if (tab !== 'photos') return undefined;
    lightboxRef.current = GLightbox({ selector: '.glightbox' });
    return () => lightboxRef.current?.destroy();
  }, [data.photos, tab]);

  const updateField = (field, value) => {
    updateContent((prev) => ({
      ...prev,
      photosAwards: { ...prev.photosAwards, [field]: value }
    }));
  };

  const addPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile('images', file);
      updateContent((prev) => ({
        ...prev,
        photosAwards: {
          ...prev.photosAwards,
          photos: [...prev.photosAwards.photos, { id: uid(), url: result.url, caption: '' }]
        }
      }));
      showToast('Photo added — click Save to persist');
    } catch (err) {
      showToast(err.message, true);
    }
    e.target.value = '';
  };

  const updatePhoto = (index, photo) => {
    updateContent((prev) => {
      const photos = [...prev.photosAwards.photos];
      photos[index] = photo;
      return { ...prev, photosAwards: { ...prev.photosAwards, photos } };
    });
  };

  const removePhoto = (index) => {
    updateContent((prev) => ({
      ...prev,
      photosAwards: {
        ...prev.photosAwards,
        photos: prev.photosAwards.photos.filter((_, i) => i !== index)
      }
    }));
  };

  const addAward = () => {
    updateContent((prev) => ({
      ...prev,
      photosAwards: {
        ...prev.photosAwards,
        awards: [...prev.photosAwards.awards, {
          id: uid(),
          nameAr: 'اسم الجائزة',
          body: 'الجهة المانحة',
          year: '2024',
          image: null
        }]
      }
    }));
  };

  const updateAward = (index, award) => {
    updateContent((prev) => {
      const awards = [...prev.photosAwards.awards];
      awards[index] = award;
      return { ...prev, photosAwards: { ...prev.photosAwards, awards } };
    });
  };

  const removeAward = (index) => {
    updateContent((prev) => ({
      ...prev,
      photosAwards: {
        ...prev.photosAwards,
        awards: prev.photosAwards.awards.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <section id="photos" className="section section-photos">
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

      <div className="tabs tabs-subsection">
        <button type="button" className={`tab-btn ${tab === 'photos' ? 'active' : ''}`} onClick={() => setTab('photos')}>
          <span dir="rtl" lang="ar">{data.photosTitleAr}</span>
          <span>{data.photosTitleEn}</span>
        </button>
        <button type="button" className={`tab-btn ${tab === 'awards' ? 'active' : ''}`} onClick={() => setTab('awards')}>
          <span dir="rtl" lang="ar">{data.awardsTitleAr}</span>
          <span>{data.awardsTitleEn}</span>
        </button>
      </div>

      {tab === 'photos' ? (
        <>
          <div className="photo-gallery">
            {data.photos.map((photo, i) => (
              <figure key={photo.id} className="gallery-item">
                {!isEditor ? (
                  <a href={photo.url} className="glightbox" data-gallery="photos">
                    <img src={photo.url} alt={photo.caption || 'Gallery photo'} />
                  </a>
                ) : (
                  <EditableImage
                    src={photo.url}
                    alt={photo.caption}
                    onReplace={(url) => updatePhoto(i, { ...photo, url })}
                    onRemove={() => removePhoto(i)}
                  />
                )}
                <EditableText
                  tag="figcaption"
                  className="gallery-caption"
                  dir="rtl"
                  lang="ar"
                  value={photo.caption || ''}
                  onChange={(v) => updatePhoto(i, { ...photo, caption: v })}
                />
              </figure>
            ))}
          </div>

          {isEditor && (
            <>
              <button type="button" className="btn-add" onClick={() => photoInputRef.current?.click()}>
                + Add Photo
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={addPhoto} />
            </>
          )}
        </>
      ) : (
        <>
          <div className="awards-grid awards-grid-2col">
            {data.awards.map((award, i) => (
              <article key={award.id} className="award-card award-card-gold">
                {award.image ? (
                  <div className="award-image-wrap">
                    <EditableImage
                      src={award.image}
                      alt={award.nameAr}
                      onReplace={(url) => updateAward(i, { ...award, image: url })}
                      onRemove={() => updateAward(i, { ...award, image: null })}
                    />
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
            {data.awards.length === 0 && !isEditor && (
              <p className="empty-state" dir="rtl" lang="ar">لا توجد جوائز مسجلة حتى الآن.</p>
            )}
          </div>

          {isEditor && (
            <button type="button" className="btn-add" onClick={addAward}>+ Add Award</button>
          )}
        </>
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
            updateAward(index, { ...data.awards[index], image: result.url });
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
