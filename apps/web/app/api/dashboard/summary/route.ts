import { ok, fail, requestIdFrom } from "@/lib/server/api-response";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { cacheDashboardSummary, getCachedDashboardSummary } from "@/lib/server/redis";

type RiskLevel = "all" | "urgent" | "emergency" | "routine";
type SummaryData = { totalCases: number; urgentCases: number; emergencyCases: number; appliedRiskLevel: string };

async function countCases(url: string, key: string, riskLevel: RiskLevel, dateFrom?: string, dateTo?: string) {
  const endpoint = new URL(`${url}/rest/v1/cases`);
  endpoint.searchParams.set("select", "id");
  if (riskLevel !== "all") endpoint.searchParams.set("risk_level", `eq.${riskLevel}`);
  if (dateFrom) endpoint.searchParams.set("created_at", `gte.${dateFrom}`);
  if (dateTo) endpoint.searchParams.set("created_at", `lte.${dateTo}`);

  const response = await fetch(endpoint.toString(), {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact,head=true" }
  });
  if (!response.ok) return null;
  return Number(response.headers.get("content-range")?.split("/")[1] ?? 0);
}

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const user = await requireAuthenticatedUser(request.headers.get("authorization"));
  if (!user) return fail(401, "AUTH_REQUIRED", "Authentication required", requestId);
  if (user.role !== "supervisor" && user.role !== "admin") return fail(403, "ROLE_REQUIRED", "Supervisor or admin role required", requestId);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail(500, "SERVER_NOT_CONFIGURED", "Dashboard backend not configured", requestId);

  const params = new URL(request.url).searchParams;
  const riskLevel = (params.get("riskLevel") ?? "all") as RiskLevel;
  const dateFrom = params.get("dateFrom") ?? undefined;
  const dateTo = params.get("dateTo") ?? undefined;

  if (!["all", "urgent", "emergency", "routine"].includes(riskLevel)) {
    return fail(400, "VALIDATION_ERROR", "Invalid riskLevel filter", requestId);
  }

  const cacheKey = `summary:${riskLevel}:${dateFrom ?? ""}:${dateTo ?? ""}`;
  const cached = await getCachedDashboardSummary<SummaryData>(cacheKey);
  if (cached) return ok(cached, requestId);

  // Run count queries concurrently to reduce dashboard latency.
  const [totalCases, urgentCases, emergencyCases] = await Promise.all([
    countCases(url, key, riskLevel, dateFrom, dateTo),
    countCases(url, key, "urgent", dateFrom, dateTo),
    countCases(url, key, "emergency", dateFrom, dateTo),
  ]);

  if (totalCases === null || urgentCases === null || emergencyCases === null) {
    return fail(502, "UPSTREAM_ERROR", "Failed to query case metrics", requestId);
  }

  const data: SummaryData = { totalCases, urgentCases, emergencyCases, appliedRiskLevel: riskLevel };
  // Cache for 60 seconds to reduce repeated Supabase load during dashboard refreshes.
  await cacheDashboardSummary(cacheKey, data, 60);

  return ok(data, requestId);
}
