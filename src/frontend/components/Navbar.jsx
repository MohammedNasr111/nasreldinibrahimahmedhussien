import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { id: 'home', en: 'Home', ar: 'الرئيسية' },
  { id: 'profile', en: 'Profile', ar: 'السيرة الذاتية' },
  { id: 'publications', en: 'Publications (Books & Articles)', ar: 'المنشورات العلمية (الكتب والمقالات)' },
  { id: 'conferences', en: 'Conferences', ar: 'المؤتمرات' },
  { id: 'phd', en: 'PhD / Supervisor (Viva Chairperson)', ar: 'الإشراف الأكاديمي على الدكتوراه' },
  { id: 'photos', en: 'Photos & Awards', ar: 'الصور والجوائز' },
  { id: 'contact', en: 'Contact', ar: 'تواصل معنا' }
];

export default function Navbar({ onLoginClick }) {
  const { isEditor, logout } = useAuth();
  const [active, setActive] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <nav className="navbar">
        <button type="button" className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`nav-link ${active === item.id ? 'active' : ''}`}
                onClick={() => scrollTo(item.id)}
              >
                <span className="nav-ar" lang="ar" dir="rtl">{item.ar}</span>
                <span className="nav-en">{item.en}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="nav-admin">
          {!isEditor ? (
            <button type="button" className="btn-admin-login" onClick={onLoginClick}>
              Admin Login
            </button>
          ) : (
            <div className="admin-nav-controls">
              <span className="edit-mode-badge">Edit Mode ✏️</span>
              <button type="button" className="btn-logout" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
