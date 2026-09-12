/**
 * Google Drive asset URLs for publications, conferences, awards, etc.
 *
 * To link a file: set `driveFileId` on the item in content.json (see scripts/DRIVE_ASSETS.md).
 * Folder IDs live in content.json → driveAssets.folders.*
 */

/** Public root folder — used when driveAssets is missing or subfolder id is empty. */
export const DEFAULT_DRIVE_ROOT_FOLDER_ID = '1012jn19KZ2l9Gv7lQHqGERjToh3L15qE';

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

function hasDriveFileId(id) {
  return typeof id === 'string' && id.trim().length > 0;
}

/** Root Google Drive folder URL (always defined). */
export function resolveRootFolderUrl(driveAssets) {
  const rootId = driveAssets?.rootFolderId || DEFAULT_DRIVE_ROOT_FOLDER_ID;
  return driveFolderUrl(rootId);
}

/** Folder URL for a section; falls back to root when subfolder id is empty or driveAssets is missing. */
export function resolveSectionFolderUrl(driveAssets, sectionKey) {
  const rootId = driveAssets?.rootFolderId || DEFAULT_DRIVE_ROOT_FOLDER_ID;
  const folder = sectionKey ? driveAssets?.folders?.[sectionKey] : null;
  const subId = folder?.id?.trim();
  return driveFolderUrl(subId || rootId);
}

/** Resolve an image from driveFileId, blob/upload URL, or /assets path. Ignores /content-library/. */
export function resolveImageUrl(imageUrl, driveFileId) {
  if (hasDriveFileId(driveFileId)) return driveThumbnailUrl(driveFileId.trim(), 600);
  if (!imageUrl || isLocalContentLibraryPath(imageUrl)) return null;
  if (isHttpUrl(imageUrl) || imageUrl.startsWith('/assets/') || imageUrl.startsWith('/uploads/')) {
    return imageUrl;
  }
  return null;
}

/** Resolve PDF/document link: driveFileId → view URL, then blob/http url, else null. */
export function resolvePdfUrl(pdf) {
  if (!pdf) return null;
  if (hasDriveFileId(pdf.driveFileId)) return driveFileViewUrl(pdf.driveFileId.trim());
  if (pdf.url && !isLocalContentLibraryPath(pdf.url)) {
    if (isHttpUrl(pdf.url) || pdf.url.startsWith('/uploads/')) return pdf.url;
  }
  return null;
}

/**
 * PDF view/download URL, or section/root Google Drive folder when driveFileId is empty.
 * Never returns null — always gives visitors a working link.
 */
export function resolvePdfOrFolderUrl(pdf, folderUrl, driveAssets) {
  const direct = resolvePdfUrl(pdf);
  if (direct) return { url: direct, isDirectFile: true };
  const fallback = folderUrl || resolveRootFolderUrl(driveAssets);
  return { url: fallback, isDirectFile: false };
}
