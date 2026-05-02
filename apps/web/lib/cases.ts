export type LocalCase = {
  id: string;
  localCaseId: string;
  idempotencyKey: string;
  createdAt: string;
  symptomCluster: string;
  riskLevel: string;
  likelyCondition: string;
  recommendation: string;
  syncStatus: "unsynced" | "synced" | "failed";
  retryCount?: number;
  nextRetryAt?: string;
};

const DB_NAME = "asibi";
const STORE = "cases";
const VERSION = 3;

/**
 * Opens (and upgrades if needed) the local IndexedDB database for offline case storage.
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      // Create the store once; future migrations can bump VERSION for schema changes.
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Reads all locally stored cases.
 * Edge case: results are sorted newest-first for predictable UI ordering.
 */
export async function readCases(): Promise<LocalCase[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    // Most recent records first so users see the latest triage activity at the top.
    request.onsuccess = () => resolve((request.result as LocalCase[]).sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)));
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persists a case locally and injects sync metadata used by the server sync process.
 * Edge case: `idempotencyKey` is generated per local record to guard against duplicate uploads.
 */
export async function saveCase(localCase: Omit<LocalCase, "localCaseId" | "idempotencyKey">): Promise<void> {
  const db = await openDb();
  // localCaseId keeps a stable device-side identifier; idempotencyKey prevents duplicate server writes.
  const fullCase: LocalCase = { ...localCase, localCaseId: localCase.id, idempotencyKey: crypto.randomUUID(), retryCount: 0 };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(fullCase);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Updates sync status/retry metadata for an existing local case.
 * Edge case: if the case no longer exists locally, this is a no-op.
 */
export async function markCaseStatus(id: string, status: LocalCase["syncStatus"], retryMeta?: { retryCount: number; nextRetryAt: string }): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as LocalCase | undefined;
      // Only update when the record still exists locally (it may have been cleared by the user).
      if (existing) store.put({ ...existing, syncStatus: status, ...(retryMeta ?? {}) });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
