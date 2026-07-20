import React, { useState } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { ContentProvider, useContent } from './hooks/useContent';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import AdminToolbar from './components/AdminToolbar';
import RichTextToolbar from './components/RichTextToolbar';
import HomeSection from './components/HomeSection';
import ProfileSection from './components/ProfileSection';
import PublicationsSection from './components/PublicationsSection';
import ConferencesSection from './components/ConferencesSection';
import PhdSection from './components/PhdSection';
import PhotosAwardsSection from './components/PhotosAwardsSection';
import ContactSection from './components/ContactSection';

function SiteContent() {
  const { content, loading } = useContent();
  const [loginOpen, setLoginOpen] = useState(false);

  if (loading || !content) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <>
      <Navbar onLoginClick={() => setLoginOpen(true)} />
      <AdminToolbar />
      <RichTextToolbar />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <main>
        <HomeSection data={content.home} />
        <ProfileSection data={content.profile} />
        <PublicationsSection data={content.publications} />
        <ConferencesSection data={content.conferences} />
        <PhdSection data={content.phdSupervision} />
        <PhotosAwardsSection data={content.photosAwards} />
        <ContactSection data={content.contact} />
      </main>

      <footer className="site-footer">
        <p dir="rtl" lang="ar">
          © {new Date().getFullYear()} الأستاذ الدكتور نصر الدين إبراهيم أحمد حسين — جميع الحقوق محفوظة
        </p>
        <p dir="ltr" lang="en">
          © {new Date().getFullYear()} Prof. Dr. Nasr El Din Ibrahim Ahmed Hussein — All rights reserved
        </p>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <SiteContent />
      </ContentProvider>
    </AuthProvider>
  );
}
