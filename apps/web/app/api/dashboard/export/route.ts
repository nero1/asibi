import { ok, fail, requestIdFrom } from "@/lib/server/api-response";
import { requireAuthenticatedUser } from "@/lib/server/auth";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const user = await requireAuthenticatedUser(request.headers.get("authorization"));
  if (!user) return fail(401, "AUTH_REQUIRED", "Authentication required", requestId);
  if (user.role !== "supervisor" && user.role !== "admin") return fail(403, "ROLE_REQUIRED", "Supervisor or admin role required", requestId);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail(500, "SERVER_NOT_CONFIGURED", "Export backend not configured", requestId);

  const parsedUrl = new URL(request.url);
  const riskLevel = parsedUrl.searchParams.get("riskLevel");
  const endpoint = new URL(`${url}/rest/v1/cases`);
  endpoint.searchParams.set("select", "id,created_at,risk_level,recommended_action,chw_user_id");
  endpoint.searchParams.set("order", "created_at.desc");
  if (riskLevel && ["routine", "urgent", "emergency"].includes(riskLevel)) endpoint.searchParams.set("risk_level", `eq.${riskLevel}`);

  const response = await fetch(endpoint.toString(), { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) return fail(502, "UPSTREAM_ERROR", "Failed to export cases", requestId, await response.text());

  const rows = await response.json() as Array<Record<string, unknown>>;
  const header = ["id", "created_at", "risk_level", "recommended_action", "chw_user_id"];
  // JSON.stringify wraps fields safely so commas/newlines are escaped in CSV output.
  const csvRows = [header.join(","), ...rows.map((r) => header.map((h) => JSON.stringify(r[h] ?? "")).join(","))];

  return ok({ filename: `asibi-cases-${new Date().toISOString().slice(0, 10)}.csv`, csv: csvRows.join("\n") }, requestId);
}

