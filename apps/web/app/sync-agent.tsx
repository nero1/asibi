"use client";


import { useEffect } from "react";
import { readCases } from "@/lib/cases";

const LOCK_KEY = "asibi_sync_lock";

function acquireLock(): boolean {
  const now = Date.now();
  const current = Number(localStorage.getItem(LOCK_KEY) ?? 0);
  // Prevent two tabs from syncing simultaneously for ~25 seconds.
  if (current && now - current < 25000) return false;
  localStorage.setItem(LOCK_KEY, String(now));
  return true;
}

function releaseLock() {
  localStorage.removeItem(LOCK_KEY);
}

export default function SyncAgent() {
  useEffect(() => {
    const run = async () => {
      if (!navigator.onLine || !acquireLock()) return;
      try {
        const cases = await readCases();
        const due = cases.filter((c) => c.syncStatus !== "synced" && (!c.nextRetryAt || new Date(c.nextRetryAt).getTime() <= Date.now()));
        if (!due.length) return;
        await fetch("/api/cases/sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ cases: due })
        });
      } finally {
        releaseLock();
      }
    };

    run();
    const id = setInterval(run, 30000);
    window.addEventListener("online", run);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", run);
    };
  }, []);

  return null;
}

