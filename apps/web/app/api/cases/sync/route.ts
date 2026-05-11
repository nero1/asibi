import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { fail, ok, requestIdFrom } from "@/lib/server/api-response";
import { verifyCsrf } from "@/lib/server/security";
import { checkRateLimit } from "@/lib/server/rate-limit";

const localCaseSchema = z.object({
  id: z.string().min(1),
  localCaseId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  createdAt: z.string().min(1),
  patientAgeRange: z.string().default("unknown"),
  patientSex: z.string().optional(),
  symptomCluster: z.string().min(1),
  answers: z.record(z.boolean()).default({}),
  riskLevel: z.string().min(1),
  likelyCondition: z.string().min(1),
  recommendation: z.string().min(1),
  redFlags: z.array(z.string()).default([]),
  careAdvice: z.string().default(""),
  referralRequired: z.boolean().default(false),
  decisionTreeVersion: z.string().default("v2"),
  appVersion: z.string().default("0.2.0"),
});

const payloadSchema = z.object({ cases: z.array(localCaseSchema).min(1) });
type SyncResult = { id: string; status: "synced" | "duplicate" | "failed"; message?: string };

async function syncToSupabase(cases: z.infer<typeof localCaseSchema>[], userId: string): Promise<SyncResult[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return cases.map((c) => ({ id: c.id, status: "failed", message: "Server sync not configured" }));

  // Sync one record at a time so each case gets its own success/failure status.
  const results: SyncResult[] = [];
  for (const c of cases) {
    const response = await fetch(`${url}/rest/v1/cases`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        id: c.id,
        local_case_id: c.localCaseId,
        idempotency_key: c.idempotencyKey,
        chw_user_id: userId,
        patient_age_range: c.patientAgeRange,
        patient_sex: c.patientSex ?? null,
        symptoms: { cluster: c.symptomCluster },
        answers: c.answers,
        triage_result: {
          likelyCondition: c.likelyCondition,
          riskLevel: c.riskLevel,
          redFlags: c.redFlags,
          careAdvice: c.careAdvice,
        },
        recommended_action: c.recommendation,
        risk_level: c.riskLevel,
        referral_required: c.referralRequired,
        decision_tree_version: c.decisionTreeVersion,
        app_version: c.appVersion,
        synced_at: new Date().toISOString(),
      })
    });

    if (response.ok) results.push({ id: c.id, status: "synced" });
    else {
      const errorText = await response.text();
      const duplicate = errorText.includes("duplicate key") || response.status === 409;
      results.push({ id: c.id, status: duplicate ? "duplicate" : "failed", message: duplicate ? "Already synced" : errorText });
    }
  }
  return results;
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  if (!(await verifyCsrf(request))) return fail(403, "CSRF_INVALID", "CSRF validation failed", requestId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  // Sync can burst in poor-network conditions but still needs abuse limits.
  const rate = await checkRateLimit(`sync:${ip}`, 30, 60_000);
  if (!rate.ok) return fail(429, "RATE_LIMITED", "Too many requests", requestId, { retryAfterSec: rate.retryAfterSec });
  const user = await requireAuthenticatedUser(request.headers.get("authorization"));
  if (!user) return fail(401, "AUTH_REQUIRED", "Authentication required", requestId);
  if (user.role !== "chw") return fail(403, "ROLE_REQUIRED", "Only CHW accounts can sync field cases", requestId);

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return fail(400, "VALIDATION_ERROR", "Validation error", requestId, parsed.error.flatten());

  const results = await syncToSupabase(parsed.data.cases, user.id);
  return ok({ results }, requestId);
}
