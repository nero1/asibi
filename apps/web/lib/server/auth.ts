import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export type AuthenticatedUser = { id: string; role: "chw" | "supervisor" | "admin" };

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set("asibi_access_token", accessToken, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  response.cookies.set("asibi_refresh_token", refreshToken, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("asibi_access_token", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("asibi_refresh_token", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getBearerToken(authHeader: string | null): Promise<string | null> {
  if (authHeader?.startsWith("Bearer ")) return authHeader.replace("Bearer ", "");
  const cookieStore = await cookies();
  return cookieStore.get("asibi_access_token")?.value ?? null;
}

export async function requireAuthenticatedUser(authHeader: string | null): Promise<AuthenticatedUser | null> {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const token = await getBearerToken(authHeader);
  if (!url || !anon || !token) return null;

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anon }
  });
  if (!response.ok) return null;

  const user = (await response.json()) as { id?: string; user_metadata?: { role?: string } };
  const role = user.user_metadata?.role;
  const normalizedRole: AuthenticatedUser["role"] = role === "supervisor" || role === "admin" ? role : "chw";
  return user.id ? { id: user.id, role: normalizedRole } : null;
}
