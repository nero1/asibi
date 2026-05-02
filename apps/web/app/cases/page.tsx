"use client";


import { useEffect, useState } from "react";
import { readCases, type LocalCase } from "@/lib/cases";
import { applySyncResults } from "@/lib/sync";
import { getSavedLang, strings } from "@/lib/i18n";
import { ensureCsrfToken } from "@/lib/csrf";

type SyncResult = { id: string; status: "synced" | "duplicate" | "failed"; message?: string };

export default function CasesPage() {
  const [cases, setCases] = useState<LocalCase[]>([]);
  const [lastSyncMessage, setLastSyncMessage] = useState("");
  const unsynced = cases.filter((c) => c.syncStatus !== "synced");
  const lang = getSavedLang();

  useEffect(() => {
    readCases().then(setCases);
  }, []);

  async function syncUnsynced() {
    if (!unsynced.length) return;
    setLastSyncMessage("");

    const csrf = await ensureCsrfToken();
    let response = await fetch("/api/cases/sync", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      credentials: "include",
      body: JSON.stringify({ cases: unsynced })
    });

    // Attempt one silent refresh before showing a login-required error.
    if (response.status === 401) {
      const refreshResponse = await fetch("/api/auth/refresh", { method: "POST", credentials: "include", headers: { "x-csrf-token": csrf } });
      if (refreshResponse.ok) {
        response = await fetch("/api/cases/sync", {
          method: "POST",
          headers: { "content-type": "application/json", "x-csrf-token": csrf },
          credentials: "include",
          body: JSON.stringify({ cases: unsynced })
        });
      }
    }

    if (!response.ok) {
      setLastSyncMessage(response.status === 401 ? "Sync blocked: login required." : "Sync failed before server processing.");
      return;
    }

    const body = (await response.json()) as { data: { results: SyncResult[] } };
    await applySyncResults(body.data.results, unsynced);

    const failed = body.data.results.filter((r) => r.status === "failed").length;
    setLastSyncMessage(failed ? `Synced with ${failed} failures. Retry later.` : "All unsynced cases uploaded.");
    setCases(await readCases());
  }

  return (
    <main className="container">
      <h1>{strings[lang].casesTitle}</h1>
      <p>{strings[lang].unsynced}: {unsynced.length}</p>
      <button onClick={syncUnsynced}>{strings[lang].sync}</button>
      {lastSyncMessage && <p>{lastSyncMessage}</p>}
      {cases.map((item) => (
        <article className="card" key={item.id}>
          <p><strong>{item.riskLevel.toUpperCase()}</strong> · {item.symptomCluster}</p>
          <p>{new Date(item.createdAt).toLocaleString()}</p>
          <p>{strings[lang].status}: {item.syncStatus}</p>
          {item.nextRetryAt ? <p>{strings[lang].nextRetry}: {new Date(item.nextRetryAt).toLocaleString()}</p> : null}
        </article>
      ))}
    </main>
  );
}

