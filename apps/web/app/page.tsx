"use client";


import Link from "next/link";
import { useEffect, useState } from "react";
import { readCases } from "@/lib/cases";
import { strings, type Lang, getSavedLang, saveLang } from "@/lib/i18n";
import { ensureCsrfToken } from "@/lib/csrf";


export default function HomePage() {
  const [online, setOnline] = useState(true);
  const [unsynced, setUnsynced] = useState(0);
  const [lang, setLang] = useState<Lang>("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLang(getSavedLang());
    setOnline(navigator.onLine);
    readCases().then((rows) => setUnsynced(rows.filter((c) => c.syncStatus !== "synced").length));
    // Keep UI status badge in sync with browser online/offline events.
    const onStatus = () => setOnline(navigator.onLine);
    window.addEventListener("online", onStatus);
    window.addEventListener("offline", onStatus);
    return () => { window.removeEventListener("online", onStatus); window.removeEventListener("offline", onStatus); };
  }, []);

  async function login() {
    const r = await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},credentials:'include',body:JSON.stringify({email,password})});
    setMessage(r.ok ? 'Login successful.' : 'Login failed.');
  }
  async function refreshSession() { const csrf = await ensureCsrfToken(); const r = await fetch('/api/auth/refresh',{method:'POST',credentials:'include',headers:{'x-csrf-token':csrf}}); setMessage(r.ok ? 'Session refreshed.' : 'Refresh failed.'); }
  async function logout() { const csrf = await ensureCsrfToken(); await fetch('/api/auth/logout',{method:'POST',credentials:'include',headers:{'x-csrf-token':csrf}}); setMessage('Logged out.'); }

  return (
    <main className="container">
      <h1>{strings[lang].title}</h1>
      <label>{strings[lang].language}</label>
      <select value={lang} onChange={(e)=>{ const l=e.target.value as Lang; setLang(l); saveLang(l); }}><option value="en">English</option><option value="ha">Hausa</option><option value="yo">Yoruba</option><option value="ig">Igbo</option></select>
      <p>Status: {online ? strings[lang].online : strings[lang].offline} · {strings[lang].unsynced}: {unsynced}</p>
      <section className="card">
        <h2>CHW Sign In</h2>
        <label>Email</label><input value={email} onChange={(e)=>setEmail(e.target.value)} />
        <label>Password</label><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <div className="actions"><button onClick={login}>Login</button><button onClick={refreshSession}>Refresh Session</button><button onClick={logout}>Logout</button></div>
        {message && <p>{message}</p>}
      </section>
      <nav className="actions"><Link href="/triage">{strings[lang].triage}</Link><Link href="/cases">{strings[lang].cases}</Link><Link href="/dashboard">{strings[lang].dashboard}</Link></nav>
    </main>
  );
}

