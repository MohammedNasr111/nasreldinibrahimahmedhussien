# Google Drive asset mapping

Heavy files live in this public folder:

**https://drive.google.com/drive/folders/1012jn19KZ2l9Gv7lQHqGERjToh3L15qE**

Subfolders (upload as-is): `books in the website`, `academic articles`, `Research`, `conference`, `awards`.

## 1. Optional: subfolder IDs (section “Browse” buttons)

1. Open the subfolder in Google Drive.
2. Copy the URL: `https://drive.google.com/drive/folders/SUBFOLDER_ID_HERE`
3. In `content.json` → `driveAssets.folders`, set `"id": "SUBFOLDER_ID_HERE"` for that section (e.g. `books`, `articles`).

If `id` is empty, the site uses `rootFolderId` for “Browse on Google Drive”.

## 2. Per-file links (View / Download on each card)

1. Right-click the file in Drive → **Share** → **Anyone with the link** (Viewer).
2. **Get link** — URL looks like:
   - `https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing`
3. The **file ID** is the long string between `/d/` and `/view`:
   - `1AbCdEfGhIjKlMnOpQrStUvWxYz`

### Where to paste the file ID in `content.json`

| Content | JSON field |
|--------|------------|
| Book PDF | `publications.books[].pdf.driveFileId` |
| Book cover | `publications.books[].coverDriveFileId` |
| Article PDF | `publications.articles[].pdf.driveFileId` |
| Research PDF | `publications.research[].pdf.driveFileId` |
| Conference paper | `conferences.items[].pdf.driveFileId` |
| Award image | `photosAwards.awards[].imageDriveFileId` |
| Gallery photo | `photosAwards.photos[].driveFileId` |
| CV | `profile.cvPdf.driveFileId` |

Example:

```json
"pdf": {
  "driveFileId": "1AbCdEfGhIjKlMnOpQrStUvWxYz",
  "filename": "Book 1 - 270 page.pdf",
  "sourceHint": "books/01/book.pdf"
}
```

`sourceHint` is only for your reference when matching files; the site does not use it.

## 3. Re-run migration (if you restore old local paths)

```bash
node scripts/migrate-to-drive.js
```

This strips `/content-library/` URLs and resets empty `driveFileId` placeholders.
