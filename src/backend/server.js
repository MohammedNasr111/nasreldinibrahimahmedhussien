require('dotenv').config();

const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const fs = require('fs');
const storage = require('./lib/storage');
const { sendContactEmail, isEmailConfigured } = require('./lib/email');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..', '..');
const UPLOADS_DIR = path.join(ROOT, 'uploads');
const DIST_DIR = path.join(ROOT, 'dist');
const SESSION_MAX_AGE = 2 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'nasr_session',
  keys: [process.env.SESSION_SECRET || 'nasr-default-secret-change-me'],
  maxAge: SESSION_MAX_AGE,
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction
}));

app.use('/assets', express.static(path.join(ROOT, 'assets')));
if (fs.existsSync(UPLOADS_DIR)) {
  app.use('/uploads', express.static(UPLOADS_DIR));
}

function requireAuth(req, res, next) {
  if (req.session && req.session.isEditor) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

function createUploader(type) {
  const upload = storage.createMemoryUpload(type, storage.UPLOAD_LIMITS);
  return (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          const maxMb = Math.round((storage.UPLOAD_LIMITS[type] || 0) / (1024 * 1024));
          return res.status(400).json({ error: `File too large. Maximum size is ${maxMb}MB.` });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
}

const uploaders = {
  images: createUploader('images'),
  pdfs: createUploader('pdfs')
};

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const editorPassword = process.env.EDITOR_PASSWORD || 'Nasr2025';

  if (password === editorPassword) {
    req.session.isEditor = true;
    req.session.lastActivity = Date.now();
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Invalid password' });
});

app.post('/api/auth/logout', (req, res) => {
  req.session = null;
  res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
  if (req.session && req.session.isEditor) {
    req.session.lastActivity = Date.now();
    return res.json({ isEditor: true });
  }
  return res.json({ isEditor: false });
});

app.get('/api/content', async (req, res) => {
  try {
    res.json(await storage.readContent());
  } catch (err) {
    console.error('Failed to read content:', err);
    res.status(500).json({ error: 'Failed to read content' });
  }
});

app.post('/api/content', requireAuth, async (req, res) => {
  try {
    await storage.writeContent(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to save content:', err);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

async function handleUpload(type, req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const result = await storage.uploadFile(type, req.file);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
}

app.post('/api/upload/images', requireAuth, uploaders.images, (req, res) => {
  handleUpload('images', req, res);
});

app.post('/api/upload/pdfs', requireAuth, uploaders.pdfs, (req, res) => {
  handleUpload('pdfs', req, res);
});

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const submission = {
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim()
  };

  if (!isEmailConfigured()) {
    console.error('Contact form failed: SMTP is not configured');
    return res.status(503).json({
      error: 'Unable to send your message right now. Please try again later or email us directly.'
    });
  }

  try {
    await sendContactEmail(submission);
    res.json({
      success: true,
      messageAr: 'شكرًا لكم! تم إرسال رسالتكم بنجاح.',
      messageEn: 'Thank you! Your message has been sent successfully.'
    });
  } catch (err) {
    console.error('Failed to send contact email:', err);
    res.status(500).json({
      error: 'Unable to send your message. Please check your connection and try again.'
    });
  }
});

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(503).send('Frontend not built. Run npm run build or npm run dev:client for development.');
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    const storageMode = storage.isBlobEnabled() ? 'Vercel Blob' : 'local filesystem';
    console.log(`Nasr website running on port ${PORT} (storage: ${storageMode})`);
  });
}

module.exports = app;
