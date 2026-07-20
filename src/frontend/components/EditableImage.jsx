import React, { useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { uploadFile } from '../utils/api';
import { useContent } from '../hooks/useContent';

export default function EditableImage({ src, alt, onReplace, onRemove, className = '' }) {
  const inputRef = useRef(null);
  const { isEditor } = useAuth();
  const { showToast } = useContent();

  const handleReplace = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile('images', file);
      onReplace(result.url);
      showToast('Image updated — click Save to persist');
    } catch (err) {
      showToast(err.message, true);
    }
    e.target.value = '';
  };

  return (
    <div className={`editable-image-wrap ${className}`}>
      <img src={src} alt={alt || ''} className="editable-image" />
      {isEditor && (
        <div className="image-edit-overlay">
          <button type="button" className="edit-img-btn" onClick={() => inputRef.current?.click()}>
            Replace 🖼️
          </button>
          {onRemove && (
            <button type="button" className="edit-img-btn remove" onClick={onRemove}>
              Remove ✕
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleReplace} />
        </div>
      )}
    </div>
  );
}
