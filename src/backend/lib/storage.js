const fs = require('fs');
const path = require('path');

const CONTENT_FILE = path.join(__dirname, '..', '..', '..', 'content.json');
const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads');

const CONTENT_BLOB_PATH = 'nasr-website/content.json';

function isBlobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readBlobJson(blobPath) {
  const { list } = require('@vercel/blob');
  const { blobs } = await list({ prefix: blobPath, limit: 1 });
  const match = blobs.find((b) => b.pathname === blobPath);
  if (!match) return null;
  const res = await fetch(match.url);
  if (!res.ok) return null;
  return JSON.parse(await res.text());
}

async function writeBlobJson(blobPath, data) {
  const { put } = require('@vercel/blob');
  await put(blobPath, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

async function readContent() {
  if (isBlobEnabled()) {
    const blobContent = await readBlobJson(CONTENT_BLOB_PATH);
    if (blobContent) return blobContent;
  }
  const raw = fs.readFileSync(CONTENT_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeContent(content) {
  if (isBlobEnabled()) {
    await writeBlobJson(CONTENT_BLOB_PATH, content);
    return;
  }
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), 'utf8');
}

async function uploadFile(type, file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const base = path.basename(file.originalname, ext)
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase();
  const filename = `${base}-${Date.now()}${ext}`;

  if (isBlobEnabled()) {
    const { put } = require('@vercel/blob');
    const blobPath = `nasr-website/uploads/${type}/${filename}`;
    const blob = await put(blobPath, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      addRandomSuffix: false
    });
    return {
      url: blob.url,
      filename: file.originalname,
      size: file.size,
      sizeFormatted: formatFileSize(file.size)
    };
  }

  const dest = path.join(UPLOADS_DIR, type);
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, filename), file.buffer);

  return {
    url: `/uploads/${type}/${filename}`,
    filename: file.originalname,
    size: file.size,
    sizeFormatted: formatFileSize(file.size)
  };
}

function createMemoryUpload(type, limits) {
  const multer = require('multer');
  const allowed = {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    pdfs: ['.pdf']
  };

  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: limits[type] || 10 * 1024 * 1024 },
    fileFilter(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const list = allowed[type];
      if (list && list.includes(ext)) {
        cb(null, true);
      } else {
        const messages = {
          images: 'Only image files are allowed',
          pdfs: 'Only PDF files are allowed'
        };
        cb(new Error(messages[type] || 'Invalid file type'));
      }
    }
  });
}

module.exports = {
  isBlobEnabled,
  readContent,
  writeContent,
  uploadFile,
  createMemoryUpload,
  formatFileSize,
  UPLOAD_LIMITS: {
    images: 10 * 1024 * 1024,
    pdfs: 25 * 1024 * 1024
  }
};
