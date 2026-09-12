import React from 'react';
import { resolveSectionFolderUrl } from '../utils/driveUrls';

/**
 * Section-level link when files are hosted on Google Drive.
 * Shown above books/articles/research/conferences/awards lists.
 */
export default function DriveFolderBanner({ driveAssets, sectionKey, labelAr, labelEn }) {
  const folderUrl = resolveSectionFolderUrl(driveAssets, sectionKey);
  if (!folderUrl) return null;

  return (
    <div className="drive-folder-banner">
      <p dir="rtl" lang="ar">
        {labelAr || 'الملفات متاحة على Google Drive'}
        {' — '}
        <a href={folderUrl} target="_blank" rel="noopener noreferrer">
          فتح المجلد
        </a>
      </p>
      <p dir="ltr" lang="en">
        {labelEn || 'Files are hosted on Google Drive'}
        {' — '}
        <a href={folderUrl} target="_blank" rel="noopener noreferrer">
          Open folder
        </a>
      </p>
    </div>
  );
}
