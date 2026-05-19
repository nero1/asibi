"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { strings, type Lang, getSavedLang } from "@/lib/i18n";

export default function NavBar() {
  const pathname = usePathname();
  const [lang, setLang] = useState<Lang>("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setLang(getSavedLang());
    setOnline(navigator.onLine);
    const onStorage = () => setLang(getSavedLang());
    const onStatus = () => setOnline(navigator.onLine);
    window.addEventListener("storage", onStorage);
    window.addEventListener("online", onStatus);
    window.addEventListener("offline", onStatus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("online", onStatus);
      window.removeEventListener("offline", onStatus);
    };
  }, []);

  // Hide on landing page — it has its own header
  if (pathname === "/") return null;

  const t = strings[lang];

  const links: { href: "/app" | "/triage" | "/cases" | "/dashboard" | "/help"; label: string }[] = [
    { href: "/app", label: t.title },
    { href: "/triage", label: t.triage },
    { href: "/cases", label: t.cases },
    { href: "/dashboard", label: t.dashboard },
    { href: "/help", label: t.helpTitle },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">Asibi</Link>

        <div className="navbar-status">
          <span className={`status-dot ${online ? "status-dot--online" : "status-dot--offline"}`} />
          <span className="status-label">{online ? t.online : t.offline}</span>
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen((m) => !m)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span className={`hamburger ${menuOpen ? "hamburger--open" : ""}`} />
        </button>

        <nav className={`navbar-links${menuOpen ? " navbar-links--open" : ""}`} aria-label="Main navigation">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`navbar-link${pathname === href || (href !== "/app" && pathname.startsWith(href)) ? " navbar-link--active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
