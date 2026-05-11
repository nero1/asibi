"use client";

import { useState } from "react";
import { getSavedLang, strings } from "@/lib/i18n";

type Summary = { totalCases: number; urgentCases: number; emergencyCases: number; appliedRiskLevel: string };
type CaseRow = { id: string; created_at: string; risk_level: string; recommended_action: string; chw_user_id: string; patient_age_range?: string };
type ChwStatRow = { chw_user_id: string; total_cases: number; urgent_cases: number; emergency_cases: number; last_case_at: string };
type AuditRow = { id: string; actor_user_id: string; actor_role: string; action: string; payload: Record<string, unknown>; created_at: string };

const CLUSTER_OPTIONS = ["", "fever", "breathing", "vomiting_diarrhea", "confusion_collapse", "skin_rash", "other"];

export default function DashboardPage() {
  const lang = getSavedLang();
  const t = strings[lang];

  // Filters
  const [riskLevel, setRiskLevel] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [illnessType, setIllnessType] = useState("");
  const [chwUserId, setChwUserId] = useState("");

  // Data sections
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [chwStats, setChwStats] = useState<ChwStatRow[]>([]);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  function buildFilterParams(extra?: Record<string, string>) {
    const p = new URLSearchParams();
    if (riskLevel && riskLevel !== "all") p.set("riskLevel", riskLevel);
    if (dateFrom) p.set("dateFrom", dateFrom);
    if (dateTo) p.set("dateTo", dateTo);
    if (illnessType) p.set("illnessType", illnessType);
    if (chwUserId.trim()) p.set("chwUserId", chwUserId.trim());
    if (extra) Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return p.toString();
  }

  async function loadSummary() {
    const response = await fetch(`/api/dashboard/summary?${buildFilterParams()}`, { credentials: "include" });
    const body = await response.json();
    if (!response.ok) return setMessage(body?.error?.message ?? "Failed to load dashboard.");
    setSummary(body.data);
    setMessage("");
  }

  async function loadCases(nextPage = 1) {
    const response = await fetch(`/api/dashboard/cases?${buildFilterParams({ page: String(nextPage), limit: "20" })}`, { credentials: "include" });
    const body = await response.json();
    if (!response.ok) return setMessage(body?.error?.message ?? "Failed to load case rows.");
    setRows(body.data.rows);
    setPage(body.data.page);
  }

  async function loadChwStats() {
    const response = await fetch("/api/dashboard/chw-stats", { credentials: "include" });
    const body = await response.json();
    if (!response.ok) return setMessage(body?.error?.message ?? "Failed to load CHW stats.");
    setChwStats(body.data.rows ?? []);
  }

  async function loadAuditLogs(nextPage = 1) {
    const response = await fetch(`/api/audit?page=${nextPage}&limit=20`, { credentials: "include" });
    const body = await response.json();
    if (!response.ok) return setMessage(body?.error?.message ?? "Failed to load audit logs.");
    setAuditRows(body.data.rows ?? []);
    setAuditPage(body.data.page ?? 1);
    setAuditTotal(body.data.total ?? 0);
  }

  async function exportCsv() {
    const response = await fetch(`/api/dashboard/export?${buildFilterParams()}`, { credentials: "include" });
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
      <h1>{t.dashTitle}</h1>

      {/* ── Filters ── */}
      <section className="card">
        <h2>Filters</h2>
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>{t.riskFilter}</label>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
              <option value="all">All</option>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div>
            <label>{t.illnessFilter}</label>
            <select value={illnessType} onChange={(e) => setIllnessType(e.target.value)}>
              {CLUSTER_OPTIONS.map((c) => (
                <option key={c} value={c}>{c === "" ? "All" : c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label>{t.dateFrom}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label>{t.dateTo}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>{t.chwFilter}</label>
            <input type="text" value={chwUserId} onChange={(e) => setChwUserId(e.target.value)} placeholder="UUID" />
          </div>
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="actions" style={{ flexWrap: "wrap" }}>
        <button onClick={loadSummary}>{t.loadSummary}</button>
        <button onClick={() => loadCases(1)}>Load Cases</button>
        <button onClick={exportCsv}>Export CSV</button>
        <button onClick={loadChwStats}>{t.loadChwStats}</button>
        <button onClick={() => loadAuditLogs(1)}>{t.loadAuditLogs}</button>
      </div>

      {message && <p style={{ color: "red" }}>{message}</p>}

      {/* ── Summary ── */}
      {summary && (
        <section className="card">
          <h2>{t.loadSummary}</h2>
          <p>Total cases: <strong>{summary.totalCases}</strong></p>
          <p>Urgent cases: <strong>{summary.urgentCases}</strong></p>
          <p>Emergency cases: <strong>{summary.emergencyCases}</strong></p>
          <p>Applied filter: {summary.appliedRiskLevel}</p>
        </section>
      )}

      {/* ── Case Rows ── */}
      {rows.length > 0 && (
        <section>
          <h2>Cases</h2>
          {rows.map((row) => (
            <article key={row.id} className="card">
              <p><strong>{row.risk_level.toUpperCase()}</strong> · {new Date(row.created_at).toLocaleString()}</p>
              {row.patient_age_range && <p>{t.ageRangeShort}: {row.patient_age_range}</p>}
              <p>{row.recommended_action}</p>
            </article>
          ))}
          <div className="actions">
            <button onClick={() => loadCases(Math.max(1, page - 1))}>Prev</button>
            <span>Page {page}</span>
            <button onClick={() => loadCases(page + 1)}>Next</button>
          </div>
        </section>
      )}

      {/* ── CHW Statistics ── */}
      {chwStats.length > 0 && (
        <section>
          <h2>{t.chwStatsTitle}</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.4rem" }}>CHW ID</th>
                <th style={{ textAlign: "right", padding: "0.4rem" }}>Total</th>
                <th style={{ textAlign: "right", padding: "0.4rem" }}>Urgent</th>
                <th style={{ textAlign: "right", padding: "0.4rem" }}>Emergency</th>
                <th style={{ textAlign: "left", padding: "0.4rem" }}>Last Case</th>
              </tr>
            </thead>
            <tbody>
              {chwStats.map((row) => (
                <tr key={row.chw_user_id} style={{ borderTop: "1px solid #ddd" }}>
                  <td style={{ padding: "0.4rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{row.chw_user_id}</td>
                  <td style={{ textAlign: "right", padding: "0.4rem" }}>{row.total_cases}</td>
                  <td style={{ textAlign: "right", padding: "0.4rem" }}>{row.urgent_cases}</td>
                  <td style={{ textAlign: "right", padding: "0.4rem" }}>{row.emergency_cases}</td>
                  <td style={{ padding: "0.4rem" }}>{row.last_case_at ? new Date(row.last_case_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Audit Logs ── */}
      {auditRows.length > 0 && (
        <section>
          <h2>{t.auditTitle}</h2>
          <p style={{ fontSize: "0.8rem", color: "#555" }}>Total: {auditTotal}</p>
          {auditRows.map((row) => (
            <article key={row.id} className="card" style={{ fontSize: "0.85rem" }}>
              <p><strong>{row.action}</strong> · {row.actor_role} · {new Date(row.created_at).toLocaleString()}</p>
              <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#444" }}>
                Actor: {row.actor_user_id}
              </p>
              {Object.keys(row.payload ?? {}).length > 0 && (
                <p style={{ color: "#555" }}>{JSON.stringify(row.payload)}</p>
              )}
            </article>
          ))}
          <div className="actions">
            <button onClick={() => loadAuditLogs(Math.max(1, auditPage - 1))}>Prev</button>
            <span>Page {auditPage}</span>
            <button onClick={() => loadAuditLogs(auditPage + 1)}>Next</button>
          </div>
        </section>
      )}
    </main>
  );
}
