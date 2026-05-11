import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { isTokenRevoked } from "./redis";

export type AuthenticatedUser = { id: string; role: "chw" | "supervisor" | "admin" };

// Store access/refresh tokens as secure, httpOnly cookies so browser JS cannot read them.
export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set("asibi_access_token", accessToken, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  response.cookies.set("asibi_refresh_token", refreshToken, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("asibi_access_token", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("asibi_refresh_token", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getBearerToken(authHeader: string | null): Promise<string | null> {
  // API clients may send Authorization headers; browser users rely on cookies.
  if (authHeader?.startsWith("Bearer ")) return authHeader.replace("Bearer ", "");
  const cookieStore = await cookies();
  return cookieStore.get("asibi_access_token")?.value ?? null;
}

export async function requireAuthenticatedUser(authHeader: string | null): Promise<AuthenticatedUser | null> {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const token = await getBearerToken(authHeader);
  if (!url || !anon || !token) return null;

  // Reject tokens that were explicitly revoked at logout before their natural expiry.
  if (await isTokenRevoked(token)) return null;

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anon }
  });
  if (!response.ok) return null;

  const user = (await response.json()) as { id?: string; user_metadata?: { role?: string } };
  const role = user.user_metadata?.role;
  // Unknown roles are downgraded to CHW for least-privilege behavior.
  const normalizedRole: AuthenticatedUser["role"] = role === "supervisor" || role === "admin" ? role : "chw";
  return user.id ? { id: user.id, role: normalizedRole } : null;
}
