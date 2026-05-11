import { ok, requestIdFrom } from "@/lib/server/api-response";
import { getRedis } from "@/lib/server/redis";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const start = Date.now();

  const checks: Record<string, "ok" | "degraded" | "unavailable"> = {};

  // Check Redis availability.
  const redis = getRedis();
  if (!redis) {
    checks.redis = "unavailable";
  } else {
    try {
      await redis.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "degraded";
    }
  }

  // Check Supabase availability with a lightweight auth ping.
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    checks.supabase = "unavailable";
  } else {
    try {
      const supabaseStart = Date.now();
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: supabaseAnon },
        signal: AbortSignal.timeout(3000),
      });
      checks.supabase = res.ok ? "ok" : "degraded";
      checks.supabaseLatencyMs = String(Date.now() - supabaseStart) as unknown as "ok";
    } catch {
      checks.supabase = "degraded";
    }
  }

  const overallOk = checks.redis !== "unavailable" || checks.supabase !== "unavailable";

  return ok({
    status: overallOk ? "ok" : "degraded",
    service: "asibi-web",
    version: process.env.npm_package_version ?? "unknown",
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - start,
    checks,
  }, requestId);
}
