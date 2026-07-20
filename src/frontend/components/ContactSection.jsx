import React, { useState } from 'react';
import EditableText from './EditableText';
import { useContent } from '../hooks/useContent';
import { sendContact } from '../utils/api';

export default function ContactSection({ data }) {
  const { updateContent } = useContent();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    updateContent((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const result = await sendContact(form);
      setStatus({ success: true, ar: result.messageAr, en: result.messageEn });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatus({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section section-contact">
      <div className="section-header">
        <EditableText
          tag="h2"
          className="section-title-ar"
          dir="rtl"
          lang="ar"
          value={data.sectionTitleAr}
          onChange={(v) => updateField('sectionTitleAr', v)}
        />
        <EditableText
          tag="p"
          className="section-title-en"
          dir="ltr"
          lang="en"
          value={data.sectionTitleEn}
          onChange={(v) => updateField('sectionTitleEn', v)}
        />
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="contact-name">
            <span dir="rtl" lang="ar">الاسم</span> / Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="contact-email">
            <span dir="rtl" lang="ar">البريد الإلكتروني</span> / Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="contact-subject">
            <span dir="rtl" lang="ar">الموضوع</span> / Subject
          </label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            value={form.subject}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="contact-message">
            <span dir="rtl" lang="ar">الرسالة</span> / Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={6}
            value={form.message}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn-gold btn-send" disabled={loading}>
          {loading ? 'Sending…' : 'Send / إرسال'}
        </button>

        {status?.success && (
          <div className="form-success">
            <p dir="rtl" lang="ar">{status.ar}</p>
            <p dir="ltr" lang="en">{status.en}</p>
          </div>
        )}
        {status && !status.success && (
          <p className="form-error">{status.message}</p>
        )}
      </form>
    </section>
  );
}
