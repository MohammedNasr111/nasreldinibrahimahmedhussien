const nodemailer = require('nodemailer');

function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendContactEmail({ name, email, subject, message }) {
  const to = process.env.CONTACT_TO_EMAIL || 'magda@inceif.edu.my';
  const from = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;

  if (!isEmailConfigured()) {
    throw new Error('Email service is not configured');
  }

  const transport = createTransport();
  await transport.sendMail({
    from: `"Prof. Nasr Website" <${from}>`,
    to,
    replyTo: `"${name}" <${email}>`,
    subject: `[Website Contact] ${subject}`,
    text: [
      'New contact form submission from nasreldinibrahimahmedhussien.com',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      '',
      'Message:',
      message
    ].join('\n'),
    html: `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <hr>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `
  });
}

module.exports = { sendContactEmail, isEmailConfigured };
