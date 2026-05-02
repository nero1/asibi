"use client";

import { useState } from "react";
import { getSavedLang, strings } from "@/lib/i18n";

type Summary = { totalCases: number; urgentCases: number; emergencyCases: number; appliedRiskLevel: string };
type CaseRow = { id: string; created_at: string; risk_level: string; recommended_action: string; chw_user_id: string };

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [message, setMessage] = useState("");
  const [riskLevel, setRiskLevel] = useState("all");
  const [page, setPage] = useState(1);
  const lang = getSavedLang();

  async function loadSummary() {
    const response = await fetch(`/api/dashboard/summary?riskLevel=${riskLevel}`, { credentials: "include" });
    const body = await response.json();
    if (!response.ok) return setMessage(body?.error?.message ?? "Failed to load dashboard.");
    setSummary(body.data);
    setMessage("");
  }

  async function loadCases(nextPage = page) {
    const response = await fetch(`/api/dashboard/cases?riskLevel=${riskLevel}&page=${nextPage}&limit=20`, { credentials: "include" });
    const body = await response.json();
    if (!response.ok) return setMessage(body?.error?.message ?? "Failed to load case rows.");
    setRows(body.data.rows);
    setPage(body.data.page);
  }

  async function exportCsv() {
    const response = await fetch(`/api/dashboard/export?riskLevel=${riskLevel}`, { credentials: "include" });
    const body = await response.json();
    if (!response.ok) return setMessage(body?.error?.message ?? "Failed to export.");
    const blob = new Blob([body.data.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = body.data.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="container">
      <h1>{strings[lang].dashTitle}</h1>
      <label>{strings[lang].riskFilter}</label>
      <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
        <option value="all">All</option><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option>
      </select>
      <div className="actions">
        <button onClick={loadSummary}>{strings[lang].loadSummary}</button>
        <button onClick={() => loadCases(1)}>Load Case Rows</button>
        <button onClick={exportCsv}>Export CSV</button>
      </div>
      {message && <p>{message}</p>}
      {summary && <section className="card"><p>Total cases: {summary.totalCases}</p><p>Urgent cases: {summary.urgentCases}</p><p>Emergency cases: {summary.emergencyCases}</p><p>Applied filter: {summary.appliedRiskLevel}</p></section>}
      {rows.map((row) => <article key={row.id} className="card"><p><strong>{row.risk_level}</strong> · {new Date(row.created_at).toLocaleString()}</p><p>{row.recommended_action}</p></article>)}
      <div className="actions"><button onClick={() => loadCases(Math.max(1, page - 1))}>Prev</button><button onClick={() => loadCases(page + 1)}>Next</button></div>
    </main>
  );
}
