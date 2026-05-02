import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export type AuthenticatedUser = { id: string; role: "chw" | "supervisor" | "admin" };

// Store access/refresh tokens as secure, httpOnly cookies so browser JS cannot read them.
/**
 * Sets auth cookies after successful login/refresh.
 * Edge case: cookies are `httpOnly` and `secure`, so client JS cannot access tokens directly.
 */
export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set("asibi_access_token", accessToken, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  response.cookies.set("asibi_refresh_token", refreshToken, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
}

// Clear auth cookies during logout by setting maxAge=0.
/** Clears both auth cookies during logout/session reset. */
export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("asibi_access_token", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("asibi_refresh_token", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

/**
 * Reads bearer token from Authorization header first, then falls back to cookie storage.
 * Edge case: returns null when neither source is available.
 */
export async function getBearerToken(authHeader: string | null): Promise<string | null> {
  // API clients may send Authorization headers; browser users rely on cookies.
  if (authHeader?.startsWith("Bearer ")) return authHeader.replace("Bearer ", "");
  const cookieStore = await cookies();
  return cookieStore.get("asibi_access_token")?.value ?? null;
}

/**
 * Validates current user with Supabase and normalizes role.
 * Edge cases:
 * - Returns null when env vars are missing or token is invalid.
 * - Unknown roles are downgraded to `chw` for least privilege.
 */
export async function requireAuthenticatedUser(authHeader: string | null): Promise<AuthenticatedUser | null> {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const token = await getBearerToken(authHeader);
  // Without config or token we cannot validate the caller identity.
  if (!url || !anon || !token) return null;

  // Supabase auth endpoint returns canonical user metadata for role-based checks.
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anon }
  });
  if (!response.ok) return null;

  const user = (await response.json()) as { id?: string; user_metadata?: { role?: string } };
  const role = user.user_metadata?.role;
  // Any unknown role is treated as CHW for least-privilege behavior.
  const normalizedRole: AuthenticatedUser["role"] = role === "supervisor" || role === "admin" ? role : "chw";
  return user.id ? { id: user.id, role: normalizedRole } : null;
}
