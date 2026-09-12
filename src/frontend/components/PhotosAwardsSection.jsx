import React, { useEffect, useRef, useState } from 'react';
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import DriveFolderBanner from './DriveFolderBanner';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { uploadFile, uid } from '../utils/api';
import { resolveImageUrl, resolveSectionFolderUrl } from '../utils/driveUrls';

function resolvePhotoUrl(photo) {
  return resolveImageUrl(photo.url, photo.driveFileId);
}

export default function PhotosAwardsSection({ data, driveAssets }) {
  const { isEditor } = useAuth();
  const { updateContent, showToast } = useContent();
  const [tab, setTab] = useState('photos');
  const lightboxRef = useRef(null);
  const photoInputRef = useRef(null);
  const awardImageRef = useRef(null);
  const photosFolderUrl = resolveSectionFolderUrl(driveAssets, 'photos');
  const awardsFolderUrl = resolveSectionFolderUrl(driveAssets, 'awards');
  const photos = data?.photos ?? [];
  const awards = data?.awards ?? [];

  useEffect(() => {
    if (tab !== 'photos') return undefined;
    lightboxRef.current = GLightbox({ selector: '.glightbox' });
    return () => lightboxRef.current?.destroy();
  }, [photos, tab]);

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
          photos: [...prev.photosAwards.photos, { id: uid(), url: result.url, driveFileId: '', caption: '' }]
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
      const nextPhotos = [...prev.photosAwards.photos];
      nextPhotos[index] = photo;
      return { ...prev, photosAwards: { ...prev.photosAwards, photos: nextPhotos } };
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
          image: null,
          imageDriveFileId: ''
        }]
      }
    }));
  };

  const updateAward = (index, award) => {
    updateContent((prev) => {
      const nextAwards = [...prev.photosAwards.awards];
      nextAwards[index] = award;
      return { ...prev, photosAwards: { ...prev.photosAwards, awards: nextAwards } };
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
          <DriveFolderBanner
            driveAssets={driveAssets}
            sectionKey="photos"
            labelAr="صور إضافية على Google Drive"
            labelEn="Additional photos may be on Google Drive"
          />

          <div className="photo-gallery">
            {photos.map((photo, i) => {
              const photoSrc = resolvePhotoUrl(photo);

              return (
                <figure key={photo.id || `photo-${i}`} className="gallery-item">
                  {photoSrc && !isEditor ? (
                    <a href={photoSrc} className="glightbox" data-gallery="photos">
                      <img src={photoSrc} alt={photo.caption || 'Gallery photo'} />
                    </a>
                  ) : photoSrc && isEditor ? (
                    <EditableImage
                      src={photoSrc}
                      alt={photo.caption}
                      onReplace={(url) => updatePhoto(i, { ...photo, url, driveFileId: '' })}
                      onRemove={() => updatePhoto(i, { ...photo, url: null, driveFileId: '' })}
                    />
                  ) : (
                    <div className="gallery-placeholder">
                      <div className="pub-cover-placeholder">🖼️</div>
                      {!isEditor && (
                        <a
                          href={photosFolderUrl}
                          className="btn-outline-gold btn-sm gallery-drive-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Browse on Google Drive
                        </a>
                      )}
                    </div>
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
              );
            })}
          </div>

          {photos.length === 0 && !isEditor && (
            <p className="empty-state" dir="rtl" lang="ar">
              لا توجد صور —{' '}
              <a href={photosFolderUrl} target="_blank" rel="noopener noreferrer">عرض على Google Drive</a>
            </p>
          )}

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
          <DriveFolderBanner
            driveAssets={driveAssets}
            sectionKey="awards"
            labelAr="صور الجوائز على Google Drive"
            labelEn="Award files are on Google Drive"
          />

          <div className="awards-grid awards-grid-2col">
            {awards.map((award, i) => {
              const awardSrc = resolveImageUrl(award.image, award.imageDriveFileId);

              return (
                <article key={award.id || `award-${i}`} className="award-card award-card-gold">
                  {awardSrc ? (
                    <div className="award-image-wrap">
                      <EditableImage
                        src={awardSrc}
                        alt={award.nameAr}
                        onReplace={(url) => updateAward(i, { ...award, image: url, imageDriveFileId: '' })}
                        onRemove={() => updateAward(i, { ...award, image: null, imageDriveFileId: '' })}
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
                    <EditableText
                      tag="p"
                      className="award-year"
                      dir="ltr"
                      value={award.year || ''}
                      onChange={(v) => updateAward(i, { ...award, year: v })}
                    />
                    <a
                      href={awardsFolderUrl}
                      className="btn-outline-gold btn-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {awardSrc ? 'View on Google Drive' : 'Browse on Google Drive'}
                    </a>
                  </div>
                  {isEditor && (
                    <div className="award-edit-actions">
                      {!awardSrc && (
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
              );
            })}
            {awards.length === 0 && !isEditor && (
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
            updateAward(index, {
              ...data.awards[index],
              image: result.url,
              imageDriveFileId: ''
            });
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
