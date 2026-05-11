"use client";

import { useEffect, useState } from "react";

export default function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Detect when a new SW is waiting (update available).
      const checkWaiting = (r: ServiceWorkerRegistration) => {
        if (r.waiting) {
          setNewWorker(r.waiting);
          setUpdateReady(true);
        }
      };

      checkWaiting(reg);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setNewWorker(installing);
            setUpdateReady(true);
          }
        });
      });
    }).catch(() => {
      // App works without SW — offline features just won't be available.
    });
  }, []);

  function applyUpdate() {
    if (!newWorker) return;
    newWorker.postMessage("skipWaiting");
    window.location.reload();
  }

  if (!updateReady) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#0ea5e9", color: "white",
      padding: "1rem", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: "1rem", zIndex: 9999,
    }}>
      <span>A new version of Asibi is available.</span>
      <button onClick={applyUpdate} style={{ background: "white", color: "#0ea5e9", fontWeight: 700 }}>
        Update now
      </button>
    </div>
  );
}
