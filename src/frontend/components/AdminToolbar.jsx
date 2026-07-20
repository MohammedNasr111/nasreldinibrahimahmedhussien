import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';

export default function AdminToolbar() {
  const { isEditor } = useAuth();
  const { saveContent } = useContent();

  if (!isEditor) return null;

  return (
    <div className="admin-toolbar">
      <button type="button" className="btn-save" onClick={saveContent}>
        💾 Save Changes
      </button>
    </div>
  );
}
