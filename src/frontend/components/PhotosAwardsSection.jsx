import React, { useEffect, useRef } from 'react';
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
  const lightboxRef = useRef(null);
  const photoInputRef = useRef(null);
  const awardImageRef = useRef(null);

  useEffect(() => {
    lightboxRef.current = GLightbox({ selector: '.glightbox' });
    return () => lightboxRef.current?.destroy();
  }, [data.photos]);

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

      <h3 className="subsection-title" dir="rtl" lang="ar">{data.photosTitleAr}</h3>
      <p className="subsection-title-en">{data.photosTitleEn}</p>

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

      <h3 className="subsection-title" dir="rtl" lang="ar">{data.awardsTitleAr}</h3>
      <p className="subsection-title-en">{data.awardsTitleEn}</p>

      <div className="awards-grid">
        {data.awards.map((award, i) => (
          <article key={award.id} className="award-card">
            {award.image && (
              <EditableImage
                src={award.image}
                alt={award.nameAr}
                onReplace={(url) => updateAward(i, { ...award, image: url })}
                onRemove={() => updateAward(i, { ...award, image: null })}
              />
            )}
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
            <EditableText
              tag="p"
              className="award-year"
              dir="ltr"
              value={award.year}
              onChange={(v) => updateAward(i, { ...award, year: v })}
            />
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
