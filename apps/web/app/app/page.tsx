"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readCases } from "@/lib/cases";
import { strings, type Lang, getSavedLang, saveLang, getAvailableLanguages } from "@/lib/i18n";
import { ensureCsrfToken } from "@/lib/csrf";
import { hasConsented } from "@/lib/onboarding";

export default function AppHomePage() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [unsynced, setUnsynced] = useState(0);
  const [lang, setLang] = useState<Lang>("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt(): Promise<void> } | null>(null);

  useEffect(() => {
    // Redirect to onboarding on first launch before any other interaction.
    if (!hasConsented()) { router.replace("/onboarding"); return; }

    setLang(getSavedLang());
    setOnline(navigator.onLine);
    readCases().then((rows) => setUnsynced(rows.filter((c) => c.syncStatus !== "synced").length));
    const onStatus = () => setOnline(navigator.onLine);
    window.addEventListener("online", onStatus);
    window.addEventListener("offline", onStatus);
    // Capture the browser install prompt so we can show it on demand.
    const onInstall = (e: Event) => { e.preventDefault(); setInstallPrompt(e as Event & { prompt(): Promise<void> }); };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => {
      window.removeEventListener("online", onStatus);
      window.removeEventListener("offline", onStatus);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, [router]);

  async function login() {
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ email, password }) });
    setMessage(r.ok ? "Login successful." : "Login failed.");
  }
  async function refreshSession() {
    const csrf = await ensureCsrfToken();
    const r = await fetch("/api/auth/refresh", { method: "POST", credentials: "include", headers: { "x-csrf-token": csrf } });
    setMessage(r.ok ? "Session refreshed." : "Refresh failed.");
  }
  async function logout() {
    const csrf = await ensureCsrfToken();
    await fetch("/api/auth/logout", { method: "POST", credentials: "include", headers: { "x-csrf-token": csrf } });
    setMessage("Logged out.");
  }

  const t = strings[lang];

  return (
    <main className="container">
      <h1>{t.title}</h1>
      <label>{t.language}</label>
      <select value={lang} onChange={(e) => { const l = e.target.value as Lang; setLang(l); saveLang(l); }}>
        {getAvailableLanguages().map(({ code, name }) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
      <p>Status: {online ? t.online : t.offline} · {t.unsynced}: {unsynced}</p>
      <section className="card">
        <h2>CHW Sign In</h2>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="actions">
          <button onClick={login}>Login</button>
          <button onClick={refreshSession}>Refresh Session</button>
          <button onClick={logout}>Logout</button>
        </div>
        {message && <p>{message}</p>}
      </section>
      {installPrompt && (
        <button
          className="btn-primary"
          style={{ width: "100%", marginBottom: "0.5rem" }}
          onClick={() => { installPrompt.prompt(); setInstallPrompt(null); }}
        >
          {t.installApp}
        </button>
      )}
      <nav className="actions">
        <Link href="/triage">{t.triage}</Link>
        <Link href="/cases">{t.cases}</Link>
        <Link href="/dashboard">{t.dashboard}</Link>
        {online && <Link href="/admin">{t.adminTitle}</Link>}
      </nav>
      <p style={{ fontSize: "0.8rem", marginTop: "0.5rem", textAlign: "center" }}>
        <Link href="/register">{t.registerTitle}</Link>
      </p>
    </main>
  );
}
