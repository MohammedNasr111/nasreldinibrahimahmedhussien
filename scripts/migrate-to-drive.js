/**
 * One-time migration: strip /content-library/ paths and add driveFileId placeholders.
 * Run: node scripts/migrate-to-drive.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_PATH = path.join(ROOT, 'content.json');
const ROOT_FOLDER_ID = '1012jn19KZ2l9Gv7lQHqGERjToh3L15qE';

const content = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));

function isLocalLib(value) {
  return typeof value === 'string' && value.startsWith('/content-library/');
}

function migratePdf(pdf) {
  if (!pdf) return null;
  const next = {
    driveFileId: pdf.driveFileId || '',
    filename: pdf.filename || ''
  };
  if (pdf.url && isLocalLib(pdf.url)) {
    next.sourceHint = pdf.url.replace('/content-library/', '');
  } else if (pdf.url && !isLocalLib(pdf.url)) {
    next.url = pdf.url;
  }
  return next;
}

function migrateImageField(item, urlKey, idKey) {
  const url = item[urlKey];
  if (isLocalLib(url)) {
    item.sourceHint = item.sourceHint || url.replace('/content-library/', '');
    item[urlKey] = null;
  }
  if (!item[idKey]) item[idKey] = '';
}

content.driveAssets = {
  rootFolderId: ROOT_FOLDER_ID,
  rootFolderUrl: `https://drive.google.com/drive/folders/${ROOT_FOLDER_ID}`,
  folders: {
    books: { id: '', label: 'books in the website', driveFolderName: 'books in the website' },
    articles: { id: '', label: 'academic articles', driveFolderName: 'academic articles' },
    research: { id: '', label: 'Research', driveFolderName: 'Research' },
    conferences: { id: '', label: 'conference', driveFolderName: 'conference' },
    awards: { id: '', label: 'awards', driveFolderName: 'awards' },
    photos: { id: '', label: 'photos', driveFolderName: 'photos' },
    cv: { id: '', label: 'cv', driveFolderName: 'cv' }
  }
};

for (const book of content.publications.books || []) {
  migrateImageField(book, 'coverImage', 'coverDriveFileId');
  book.pdf = migratePdf(book.pdf);
}

for (const listKey of ['articles', 'research']) {
  for (const item of content.publications[listKey] || []) {
    item.pdf = migratePdf(item.pdf);
  }
}

for (const item of content.conferences.items || []) {
  item.pdf = migratePdf(item.pdf);
  if (item.image !== undefined) {
    migrateImageField(item, 'image', 'imageDriveFileId');
  }
}

for (const award of content.photosAwards.awards || []) {
  migrateImageField(award, 'image', 'imageDriveFileId');
}

for (const photo of content.photosAwards.photos || []) {
  if (isLocalLib(photo.url)) {
    photo.sourceHint = photo.url.replace('/content-library/', '');
    photo.driveFileId = photo.driveFileId || '';
    photo.url = null;
  }
}

if (content.profile?.cvPdf) {
  content.profile.cvPdf = migratePdf(content.profile.cvPdf);
}

fs.writeFileSync(CONTENT_PATH, JSON.stringify(content, null, 2), 'utf8');
console.log('Migrated content.json to Google Drive placeholders.');
console.log('Root folder:', content.driveAssets.rootFolderUrl);
console.log('Next: add driveFileId values — see scripts/DRIVE_ASSETS.md');
