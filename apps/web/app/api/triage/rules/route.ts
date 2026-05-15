import { ok, fail, requestIdFrom } from "@/lib/server/api-response";
import { getCachedDashboardSummary, cacheDashboardSummary } from "@/lib/server/redis";

type RulesVersion = { version: string; language: string; rules_json: unknown; is_active: boolean };

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const lang = new URL(request.url).searchParams.get("lang") ?? "en";
  // BUG-011 fix: validate language to prevent cache/query key pollution.
  if (!["en", "ha", "yo", "ig"].includes(lang)) return fail(400, "VALIDATION_ERROR", "Unsupported language", requestId);

  const cacheKey = `rules:${lang}`; // BUG-011 fix: dedicated rules namespace
  const cached = await getCachedDashboardSummary<RulesVersion>(cacheKey);
  if (cached) return ok(cached, requestId);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Return the current built-in version when Supabase is not configured.
    return ok({ version: "v2", language: lang, is_active: true, rules_json: {} }, requestId);
  }

  const endpoint = new URL(`${url}/rest/v1/triage_rules`);
  endpoint.searchParams.set("select", "version,language,rules_json,is_active");
  endpoint.searchParams.set("is_active", "eq.true");
  endpoint.searchParams.set("language", `eq.${lang}`);
  endpoint.searchParams.set("order", "created_at.desc");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint.toString(), {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!response.ok) return fail(502, "UPSTREAM_ERROR", "Failed to fetch triage rules", requestId);

  const rows = await response.json() as RulesVersion[];
  const rule = rows[0] ?? { version: "v2", language: lang, is_active: true, rules_json: {} };

  // Cache for 5 minutes — rules change rarely and clients need to detect version bumps.
  await cacheDashboardSummary(cacheKey, rule, 300);
  return ok(rule, requestId);
}
