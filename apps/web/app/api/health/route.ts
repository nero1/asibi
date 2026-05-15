import { ok, requestIdFrom } from "@/lib/server/api-response";
import { getRedis } from "@/lib/server/redis";
import { requireAuthenticatedUser } from "@/lib/server/auth";

type Status = "ok" | "degraded" | "unavailable";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const start = Date.now();
  const user = await requireAuthenticatedUser(request.headers.get("authorization"));
  const isPrivileged = user?.role === "admin";

  const checks: Record<string, Status> = {};
  const metrics: Record<string, number> = {};

  const redis = getRedis();
  if (!redis) {
    checks.redis = "unavailable";
  } else {
    try {
      const redisStart = Date.now();
      await redis.ping();
      checks.redis = "ok";
      metrics.redisLatencyMs = Date.now() - redisStart;
    } catch {
      checks.redis = "degraded";
    }
  }

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
      metrics.supabaseLatencyMs = Date.now() - supabaseStart;
    } catch {
      checks.supabase = "degraded";
    }
  }

  // BUG-008 fix: stricter status policy; unavailable critical dependency => degraded.
  const statuses = Object.values(checks);
  const overallStatus: Status = statuses.includes("unavailable")
    ? "degraded"
    : statuses.includes("degraded")
      ? "degraded"
      : "ok";

  // BUG-013 fix: only privileged users receive dependency-level diagnostics.
  if (!isPrivileged) {
    return ok({
      status: overallStatus,
      service: "asibi-web",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    }, requestId);
  }

  return ok({
    status: overallStatus,
    service: "asibi-web",
    version: process.env.npm_package_version ?? "unknown",
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - start,
    checks,
    metrics,
  }, requestId);
}
