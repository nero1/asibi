"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { strings, type Lang, getSavedLang, saveLang, getAvailableLanguages } from "@/lib/i18n";

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => { setLang(getSavedLang()); }, []);

  function changeLang(l: Lang) { setLang(l); saveLang(l); }

  const t = strings[lang];

  return (
    <div className="landing-page">
      {/* Top bar */}
      <div className="landing-topbar">
        <span className="landing-logo">Asibi</span>
        <div className="landing-lang-select">
          <label htmlFor="lang-select" style={{ margin: 0 }}>{t.language}:</label>
          <select id="lang-select" value={lang} onChange={(e) => changeLang(e.target.value as Lang)}>
            {getAvailableLanguages().map(({ code, name }) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            {t.heroBadge}
          </div>

          <h1 className="hero-title">
            {t.heroTitle1} <span>{t.heroTitle2}</span><br />{t.heroTitle3}
          </h1>

          <p className="hero-subtitle">{t.landingDescription}</p>

          <div className="hero-pills">
            <span className="hero-pill">🌍 {t.featureLangTitle}</span>
            <span className="hero-pill">📶 {t.featureOfflineTitle}</span>
            <span className="hero-pill">🌡 {t.featureClimateTitle}</span>
          </div>

          <div className="hero-cta">
            <Link href="/app" className="btn-primary">{t.liveApp}</Link>
            <Link href="/demo" className="btn-outline">{t.demoBtn}</Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-svg-wrap">
            <HeroSVG />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-inner">
          <h2 className="section-title">{t.featuresTitle}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
                </svg>
              </div>
              <h3>{t.featureOfflineTitle}</h3>
              <p>{t.featureOfflineDesc}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                </svg>
              </div>
              <h3>{t.featureClimateTitle}</h3>
              <p>{t.featureClimateDesc}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <h3>{t.featureLangTitle}</h3>
              <p>{t.featureLangDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="section-inner">
          <h2 className="section-title">{t.howItWorksTitle}</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-num">1</div>
              <div>
                <h3>{t.step1Title}</h3>
                <p>{t.step1Desc}</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div>
                <h3>{t.step2Title}</h3>
                <p>{t.step2Desc}</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div>
                <h3>{t.step3Title}</h3>
                <p>{t.step3Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">{t.landingFooter}</footer>
    </div>
  );
}

function HeroSVG() {
  return (
    <svg viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: "100%", height: "auto", display: "block" }}>
      {/* Background blobs */}
      <ellipse cx="80" cy="200" rx="60" ry="30" fill="#bae6fd" opacity="0.3"/>
      <ellipse cx="240" cy="210" rx="55" ry="25" fill="#bae6fd" opacity="0.3"/>

      {/* Pulse wave */}
      <polyline points="10,155 45,155 58,125 72,185 88,105 102,155 310,155"
        fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.35"/>

      {/* ── Doctor (left) ── */}
      {/* Legs */}
      <rect x="66" y="182" width="14" height="50" rx="6" fill="#334155"/>
      <rect x="84" y="182" width="14" height="50" rx="6" fill="#334155"/>
      {/* Shoes */}
      <ellipse cx="73" cy="232" rx="10" ry="5" fill="#1e293b"/>
      <ellipse cx="91" cy="232" rx="10" ry="5" fill="#1e293b"/>
      {/* Torso / scrubs */}
      <rect x="57" y="115" width="50" height="72" rx="10" fill="#0ea5e9"/>
      {/* White coat collar detail */}
      <path d="M72 115 L82 140 L92 115" fill="white" opacity="0.6"/>
      {/* Left arm */}
      <rect x="38" y="120" width="18" height="40" rx="8" fill="#0ea5e9"/>
      <rect x="28" y="152" width="18" height="12" rx="6" fill="#fde68a"/>
      {/* Right arm extended toward patient */}
      <rect x="107" y="118" width="40" height="16" rx="7" fill="#0ea5e9"/>
      <rect x="140" y="116" width="16" height="14" rx="6" fill="#fde68a"/>
      {/* Stethoscope */}
      <path d="M78 145 Q60 165 65 180" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="65" cy="183" r="6" fill="#334155"/>
      <circle cx="65" cy="183" r="3" fill="#0ea5e9"/>
      {/* Neck */}
      <rect x="74" y="98" width="16" height="18" rx="5" fill="#fde68a"/>
      {/* Head */}
      <ellipse cx="82" cy="86" rx="22" ry="20" fill="#fde68a"/>
      {/* Hair */}
      <path d="M60 82 Q62 60 82 58 Q102 60 104 82 Q98 70 82 68 Q66 70 60 82Z" fill="#1e293b"/>
      {/* Eyes */}
      <circle cx="74" cy="86" r="2.5" fill="#1e293b"/>
      <circle cx="90" cy="86" r="2.5" fill="#1e293b"/>
      {/* Eye shine */}
      <circle cx="75" cy="85" r="1" fill="white"/>
      <circle cx="91" cy="85" r="1" fill="white"/>
      {/* Smile */}
      <path d="M76 93 Q82 97 88 93" fill="none" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Doctor badge */}
      <rect x="63" y="128" width="18" height="10" rx="2" fill="white" opacity="0.9"/>
      <rect x="66" y="131" width="12" height="1.5" rx="1" fill="#0ea5e9"/>
      <rect x="66" y="134" width="8" height="1.5" rx="1" fill="#0ea5e9"/>

      {/* ── Patient (right, seated) ── */}
      {/* Chair */}
      <rect x="188" y="200" width="74" height="10" rx="4" fill="#94a3b8"/>
      <rect x="188" y="148" width="8" height="62" rx="4" fill="#94a3b8"/>
      <rect x="254" y="148" width="8" height="62" rx="4" fill="#94a3b8"/>
      {/* Legs (dangling) */}
      <rect x="200" y="208" width="14" height="38" rx="6" fill="#334155"/>
      <rect x="236" y="208" width="14" height="38" rx="6" fill="#334155"/>
      <ellipse cx="207" cy="246" rx="10" ry="5" fill="#1e293b"/>
      <ellipse cx="243" cy="246" rx="10" ry="5" fill="#1e293b"/>
      {/* Torso */}
      <rect x="193" y="140" width="64" height="70" rx="10" fill="#fbbf24"/>
      {/* Arms resting */}
      <rect x="175" y="148" width="18" height="34" rx="8" fill="#fbbf24"/>
      <rect x="257" y="148" width="18" height="34" rx="8" fill="#fbbf24"/>
      {/* Neck */}
      <rect x="217" y="122" width="16" height="20" rx="5" fill="#fde68a"/>
      {/* Head */}
      <ellipse cx="225" cy="110" rx="22" ry="20" fill="#fde68a"/>
      {/* Hair */}
      <path d="M203 107 Q205 88 225 86 Q245 88 247 107 Q240 95 225 93 Q210 95 203 107Z" fill="#92400e"/>
      {/* Eyes */}
      <circle cx="217" cy="110" r="2.5" fill="#1e293b"/>
      <circle cx="233" cy="110" r="2.5" fill="#1e293b"/>
      <circle cx="218" cy="109" r="1" fill="white"/>
      <circle cx="234" cy="109" r="1" fill="white"/>
      {/* Slightly worried expression */}
      <path d="M219 117 Q225 115 231 117" fill="none" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round"/>

      {/* ── Medical clipboard (top-left) ── */}
      <rect x="14" y="28" width="36" height="46" rx="5" fill="white" stroke="#cbd5e1" strokeWidth="1.5"/>
      <rect x="26" y="23" width="12" height="10" rx="3" fill="#0ea5e9"/>
      <line x1="20" y1="45" x2="44" y2="45" stroke="#e2e8f0" strokeWidth="2"/>
      <line x1="20" y1="52" x2="44" y2="52" stroke="#e2e8f0" strokeWidth="2"/>
      <line x1="20" y1="59" x2="36" y2="59" stroke="#e2e8f0" strokeWidth="2"/>
      {/* Check mark */}
      <path d="M21 45 l3 3 l6-6" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>

      {/* ── Medical cross (top-right) ── */}
      <rect x="272" y="22" width="36" height="36" rx="10" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.5"/>
      <rect x="286" y="28" width="8" height="24" rx="3" fill="#0ea5e9"/>
      <rect x="279" y="35" width="22" height="8" rx="3" fill="#0ea5e9"/>

      {/* ── Heart rate indicator ── */}
      <rect x="120" y="22" width="80" height="28" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
      <polyline points="126,36 134,36 139,28 144,44 150,24 155,36 194,36"
        fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
