#!/usr/bin/env node
/**
 * Upload scoped media files to Vercel Blob and rewrite content.json /media/ URLs.
 *
 * Requires BLOB_READ_WRITE_TOKEN in .env
 * Usage: npm run upload:blob
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT_FILE = path.join(ROOT, 'content.json');
const MAP_FILE = path.join(ROOT, 'media-blob-map.json');

const MEDIA_ROOTS = [
  { category: 'books', dir: 'books in the website' },
  { category: 'articles', dir: 'academic articles' },
  { category: 'awards', dir: 'awards' },
  { category: 'cv', dir: path.join('site-content', 'cv') }
];

const MIME = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out.sort();
}

function mediaUrl(category, relPath) {
  const rel = relPath.replace(/\\/g, '/');
  const encoded = rel.split('/').map((part) => encodeURIComponent(part)).join('/');
  return `/media/${category}/${encoded}`;
}

function loadMap() {
  if (!fs.existsSync(MAP_FILE)) return {};
  return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
}

function saveMap(map) {
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
}

function rewriteUrls(value, map) {
  if (typeof value === 'string' && value.startsWith('/media/')) {
    return map[value] || value;
  }
  if (Array.isArray(value)) return value.map((v) => rewriteUrls(v, map));
  if (value && typeof value === 'object') {
    const next = {};
    for (const [k, v] of Object.entries(value)) {
      next[k] = rewriteUrls(v, map);
    }
    return next;
  }
  return value;
}

function collectMediaFiles() {
  const files = [];
  for (const { category, dir } of MEDIA_ROOTS) {
    const absDir = path.join(ROOT, dir);
    for (const absPath of walkFiles(absDir)) {
      const rel = path.relative(absDir, absPath);
      files.push({
        absPath,
        category,
        localUrl: mediaUrl(category, rel)
      });
    }
  }
  return files;
}

async function uploadFile(entry, map) {
  if (map[entry.localUrl]) return map[entry.localUrl];

  const rel = path.relative(ROOT, entry.absPath).replace(/\\/g, '/');
  const blobPath = `nasr-website/${rel}`;
  const ext = path.extname(entry.absPath).toLowerCase();
  const body = fs.readFileSync(entry.absPath);

  const blob = await put(blobPath, body, {
    access: 'public',
    contentType: MIME[ext] || 'application/octet-stream',
    addRandomSuffix: false,
    allowOverwrite: true
  });

  map[entry.localUrl] = blob.url;
  saveMap(map);
  return blob.url;
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('Missing BLOB_READ_WRITE_TOKEN in .env');
    process.exit(1);
  }

  if (!fs.existsSync(CONTENT_FILE)) {
    console.error('content.json not found. Run: python scripts/apply_phase3.py');
    process.exit(1);
  }

  const files = collectMediaFiles();
  const map = loadMap();
  let uploaded = 0;
  let skipped = 0;
  let totalBytes = 0;

  for (const f of files) {
    totalBytes += fs.statSync(f.absPath).size;
  }
  console.log(`Files: ${files.length}, total size: ${(totalBytes / (1024 * 1024)).toFixed(1)} MB\n`);

  for (let i = 0; i < files.length; i++) {
    const entry = files[i];
    const sizeMb = (fs.statSync(entry.absPath).size / (1024 * 1024)).toFixed(1);

    if (map[entry.localUrl]) {
      skipped++;
      process.stdout.write(`\r[${i + 1}/${files.length}] skip ${entry.localUrl}`);
      continue;
    }

    process.stdout.write(`\r[${i + 1}/${files.length}] upload ${entry.localUrl} (${sizeMb} MB)...`);
    await uploadFile(entry, map);
    uploaded++;
  }

  console.log(`\n\nDone: ${uploaded} uploaded, ${skipped} already in map.`);

  const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  const updated = rewriteUrls(content, map);
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(updated, null, 2), 'utf8');

  const remaining = JSON.stringify(updated).match(/\/media\//g);
  if (remaining) {
    console.warn(`Warning: ${remaining.length} /media/ paths still in content.json (not uploaded?)`);
  } else {
    console.log('content.json updated with Blob URLs.');
  }
}

main().catch((err) => {
  console.error('\nUpload failed:', err.message);
  process.exit(1);
});
