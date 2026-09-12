/**
 * Google Drive asset URLs for publications, conferences, awards, etc.
 *
 * To link a file: set `driveFileId` on the item in content.json (see scripts/DRIVE_ASSETS.md).
 * Folder IDs live in content.json → driveAssets.folders.*
 */

export function driveFolderUrl(folderId) {
  if (!folderId) return null;
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export function driveFileViewUrl(fileId) {
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function driveFileDownloadUrl(fileId) {
  if (!fileId) return null;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function driveThumbnailUrl(fileId, width = 400) {
  if (!fileId) return null;
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

function isLocalContentLibraryPath(value) {
  return typeof value === 'string' && value.startsWith('/content-library/');
}

function isHttpUrl(value) {
  return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
}

/** Resolve an image from driveFileId, blob/upload URL, or /assets path. Ignores /content-library/. */
export function resolveImageUrl(imageUrl, driveFileId) {
  if (driveFileId) return driveThumbnailUrl(driveFileId, 600);
  if (!imageUrl || isLocalContentLibraryPath(imageUrl)) return null;
  if (isHttpUrl(imageUrl) || imageUrl.startsWith('/assets/') || imageUrl.startsWith('/uploads/')) {
    return imageUrl;
  }
  return null;
}

/** Resolve PDF/document link: driveFileId → view URL, then blob/http url, else null. */
export function resolvePdfUrl(pdf) {
  if (!pdf) return null;
  if (pdf.driveFileId) return driveFileViewUrl(pdf.driveFileId);
  if (pdf.url && !isLocalContentLibraryPath(pdf.url)) {
    if (isHttpUrl(pdf.url) || pdf.url.startsWith('/uploads/')) return pdf.url;
  }
  return null;
}

/** Folder URL for a section; falls back to rootFolderId when subfolder id is empty. */
export function resolveSectionFolderUrl(driveAssets, sectionKey) {
  if (!driveAssets?.rootFolderId) return null;
  const folder = driveAssets.folders?.[sectionKey];
  const folderId = folder?.id || driveAssets.rootFolderId;
  return driveFolderUrl(folderId);
}
