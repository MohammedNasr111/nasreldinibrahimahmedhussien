import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchContent, saveContent as apiSave } from '../utils/api';

const ContentContext = createContext(null);

export function ContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    fetchContent()
      .then(setContent)
      .catch(() => showToast('Failed to load content', true))
      .finally(() => setLoading(false));
  }, [showToast]);

  const updateContent = useCallback((updater) => {
    setContent((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const saveContent = useCallback(async () => {
    try {
      await apiSave(content);
      showToast('Changes saved successfully');
    } catch {
      showToast('Failed to save changes', true);
    }
  }, [content, showToast]);

  return (
    <ContentContext.Provider value={{ content, setContent, updateContent, loading, saveContent, showToast }}>
      {children}
      {toast && (
        <div className={`toast ${toast.isError ? 'toast-error' : ''}`} role="status">
          {toast.message}
        </div>
      )}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}
