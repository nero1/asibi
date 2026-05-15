import { Redis } from "@upstash/redis";

// Redis client is initialized lazily and only when env vars are present.
// All callers must handle null gracefully — Redis is unavailable in local dev
// and optional in production (PRD §14: graceful degradation on Redis failure).
let _client: Redis | null = null;

export function getRedis(): Redis | null {
  if (_client) return _client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _client = new Redis({ url, token });
  return _client;
}

// Revoke an access token for `ttlSeconds` so auth middleware can reject it.
// Used on logout so JWTs cannot be replayed after session is cleared.
export async function revokeToken(accessToken: string, ttlSeconds = 7200): Promise<void> {
  const redis = getRedis();
  if (!redis) return; // Degrade gracefully — Supabase logout still runs
  // Use last 128 chars of the token as key to avoid oversized keys.
  const key = `revoked:${accessToken.slice(-128)}`;
  try {
    await redis.set(key, "1", { ex: ttlSeconds });
  } catch {
    // Redis failure must not block the logout response (PRD §14).
  }
}

// Returns true if the token has been explicitly revoked (post-logout).
export async function isTokenRevoked(accessToken: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false; // Cannot check — allow through; Supabase validates independently
  const key = `revoked:${accessToken.slice(-128)}`;
  try {
    return (await redis.exists(key)) === 1;
  } catch {
    return false; // Redis failure: fail open rather than locking out all users
  }
}

// Redis-backed rate limit check. Returns { ok, retryAfterSec }.
// Falls back to always-ok when Redis is unavailable so the in-memory limiter takes over.
export async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; retryAfterSec: number; source: "redis" | "fallback" }> {
  const redis = getRedis();
  if (!redis) return { ok: true, retryAfterSec: 0, source: "fallback" };

  const windowSec = Math.ceil(windowMs / 1000);
  const bucket = Math.floor(Date.now() / windowMs);
  const redisKey = `rl:${key}:${bucket}`;

  try {
    // BUG-006 fix: window-bucketed key avoids INCR/EXPIRE split races on a single rolling key.
    // Each bucket key is independent and receives a TTL; stale keys naturally expire.
    const [count] = await redis.pipeline().incr(redisKey).expire(redisKey, windowSec + 1).exec<number[]>();
    if (count > limit) {
      const ttl = await redis.ttl(redisKey);
      return { ok: false, retryAfterSec: ttl > 0 ? ttl : windowSec, source: "redis" };
    }
    return { ok: true, retryAfterSec: windowSec, source: "redis" };
  } catch {
    return { ok: true, retryAfterSec: 0, source: "fallback" };
  }
}

// Cache a dashboard summary with a short TTL to reduce repeated Supabase queries.
export async function cacheDashboardSummary(
  key: string,
  value: unknown,
  ttlSeconds = 60
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(`dash:${key}`, JSON.stringify(value), { ex: ttlSeconds });
  } catch { /* non-fatal */ }
}

export async function getCachedDashboardSummary<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(`dash:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
