import React from 'react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import { useContent } from '../hooks/useContent';

export default function HomeSection({ data }) {
  const { updateContent } = useContent();

  const updateHome = (field, value) => {
    updateContent((prev) => ({
      ...prev,
      home: { ...prev.home, [field]: value }
    }));
  };

  return (
    <section id="home" className="section section-home">
      <div className="hero-editorial">
        <div className="hero-campus-cinematic">
          <EditableImage
            className="hero-campus-img"
            src={data.campusImage}
            alt="IIUM Campus — International Islamic University Malaysia"
            onReplace={(url) => updateHome('campusImage', url)}
          />
          <div className="hero-campus-gradient" aria-hidden="true" />
          <div className="hero-campus-caption" dir="ltr" lang="en">
            International Islamic University Malaysia
          </div>
        </div>

        <div className="hero-body">
          <div className="hero-body-inner">
            <div className="hero-intro">
              <p className="hero-eyebrow" dir="ltr" lang="en">
                KIRKHS · Department of Arabic Language &amp; Literature
              </p>
              <EditableText
                tag="h1"
                className="hero-name-ar"
                dir="rtl"
                lang="ar"
                value={data.nameAr}
                onChange={(v) => updateHome('nameAr', v)}
              />
              <EditableText
                tag="h2"
                className="hero-name-en"
                dir="ltr"
                lang="en"
                value={data.nameEn}
                onChange={(v) => updateHome('nameEn', v)}
              />
              <div className="hero-rule" aria-hidden="true" />
              <EditableText
                tag="p"
                className="hero-title-ar"
                dir="rtl"
                lang="ar"
                value={data.titleAr}
                onChange={(v) => updateHome('titleAr', v)}
              />
              <EditableText
                tag="p"
                className="hero-title-en"
                dir="ltr"
                lang="en"
                value={data.titleEn}
                onChange={(v) => updateHome('titleEn', v)}
              />
            </div>

            <figure className="hero-portrait-figure">
              <div className="hero-portrait-frame">
                <div className="hero-portrait-accent" aria-hidden="true" />
                <EditableImage
                  className="hero-portrait-img"
                  src={data.portraitImage}
                  alt="Prof. Dr. Nasr El Din Ibrahim Ahmed Hussein"
                  onReplace={(url) => updateHome('portraitImage', url)}
                />
              </div>
            </figure>
          </div>
        </div>
      </div>

      <div className="welcome-block">
        <h3 className="welcome-heading" dir="rtl" lang="ar">كلمة ترحيبية</h3>
        <EditableText
          className="welcome-text"
          dir="rtl"
          lang="ar"
          value={data.welcomeMessage}
          onChange={(v) => updateHome('welcomeMessage', v)}
        />
      </div>
    </section>
  );
}
