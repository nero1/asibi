"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { strings, type Lang, getSavedLang, saveLang, getAvailableLanguages } from "@/lib/i18n";

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(getSavedLang());
  }, []);

  const t = strings[lang];

  function changeLang(l: Lang) {
    setLang(l);
    saveLang(l);
  }

  return (
    <main className="container landing">
      <div className="landing-hero">
        <h1 style={{ fontSize: "3rem", margin: "0 0 0.25rem", color: "#0ea5e9", letterSpacing: "-0.02em" }}>
          Asibi
        </h1>
        <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.75rem", lineHeight: 1.4 }}>
          {t.landingTagline}
        </p>
        <p style={{ color: "#475569", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
          {t.landingDescription}
        </p>

        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.35rem" }}>{t.language}</label>
          <select
            value={lang}
            onChange={(e) => changeLang(e.target.value as Lang)}
            style={{ display: "block", margin: "0 auto", minWidth: "160px" }}
          >
            {getAvailableLanguages().map(({ code, name }) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div className="landing-cta">
          <Link href="/app" className="btn-primary" style={{ textAlign: "center", padding: "1rem", fontSize: "1.1rem", fontWeight: 700, display: "block" }}>
            {t.liveApp}
          </Link>
          <Link href="/demo" className="btn-outline" style={{ textAlign: "center", padding: "1rem", fontSize: "1.1rem", fontWeight: 700, display: "block", textDecoration: "none", borderRadius: ".5rem", border: "2px solid #0ea5e9", color: "#0ea5e9", background: "white" }}>
            {t.demoBtn}
          </Link>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#94a3b8", marginTop: "auto", paddingTop: "1rem" }}>
        {t.landingFooter}
      </p>
    </main>
  );
}
