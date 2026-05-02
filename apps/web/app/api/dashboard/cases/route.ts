import { ok, fail, requestIdFrom } from "@/lib/server/api-response";
import { requireAuthenticatedUser } from "@/lib/server/auth";

const ALLOWED_LIMITS = new Set([10, 20, 50, 100]);

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const user = await requireAuthenticatedUser(request.headers.get("authorization"));
  if (!user) return fail(401, "AUTH_REQUIRED", "Authentication required", requestId);
  if (user.role !== "supervisor" && user.role !== "admin") return fail(403, "ROLE_REQUIRED", "Supervisor or admin role required", requestId);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail(500, "SERVER_NOT_CONFIGURED", "Dashboard backend not configured", requestId);

  const parsedUrl = new URL(request.url);
  const page = Number(parsedUrl.searchParams.get("page") ?? "1");
  const limit = Number(parsedUrl.searchParams.get("limit") ?? "20");
  const riskLevel = parsedUrl.searchParams.get("riskLevel");
  if (!Number.isInteger(page) || page < 1) return fail(400, "VALIDATION_ERROR", "Invalid page", requestId);
  if (!ALLOWED_LIMITS.has(limit)) return fail(400, "VALIDATION_ERROR", "Invalid limit", requestId);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const endpoint = new URL(`${url}/rest/v1/cases`);
  endpoint.searchParams.set("select", "id,created_at,risk_level,recommended_action,triage_result,chw_user_id");
  endpoint.searchParams.set("order", "created_at.desc");
  if (riskLevel && ["routine", "urgent", "emergency"].includes(riskLevel)) endpoint.searchParams.set("risk_level", `eq.${riskLevel}`);

  const response = await fetch(endpoint.toString(), {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: `${from}-${to}` }
  });

  if (!response.ok) return fail(502, "UPSTREAM_ERROR", "Failed to fetch cases", requestId, await response.text());
  const rows = await response.json();
  const total = Number(response.headers.get("content-range")?.split("/")[1] ?? rows.length);

  return ok({ page, limit, total, rows }, requestId);
}
