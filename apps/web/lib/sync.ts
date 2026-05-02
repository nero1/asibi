import { markCaseStatus, type LocalCase } from "@/lib/cases";

export function calculateBackoffDelayMs(retryCount: number): number {
  return Math.min(60000, 1000 * 2 ** retryCount);
}

export async function applySyncResults(results: { id: string; status: "synced" | "duplicate" | "failed" }[], sourceCases: LocalCase[]) {
  for (const result of results) {
    if (result.status === "failed") {
      const existing = sourceCases.find((c) => c.id === result.id);
      const retryCount = (existing?.retryCount ?? 0) + 1;
      const nextRetryAt = new Date(Date.now() + calculateBackoffDelayMs(retryCount)).toISOString();
      await markCaseStatus(result.id, "failed", { retryCount, nextRetryAt });
    } else {
      await markCaseStatus(result.id, "synced", { retryCount: 0, nextRetryAt: "" });
    }
  }
}
