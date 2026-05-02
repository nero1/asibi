import { cookies } from "next/headers";

/**
 * Issues a CSRF token cookie used by browser clients.
 * Edge case: token is intentionally readable by JS (httpOnly=false) so it can be echoed in `x-csrf-token`.
 */
export async function issueCsrfToken(response: { cookies: { set: Function } }) {
  // CSRF token is readable by client JS so it can be echoed in request headers.
  const token = crypto.randomUUID();
  response.cookies.set("asibi_csrf", token, { httpOnly: false, secure: true, sameSite: "lax", path: "/" });
  return token;
}

/**
 * Verifies CSRF using double-submit cookie + header matching and a basic same-origin check.
 * Edge cases:
 * - Non-browser clients may omit origin/host; those requests are allowed if token match succeeds.
 * - Missing either token source fails closed.
 */
export async function verifyCsrf(request: Request): Promise<boolean> {
  const headerToken = request.headers.get("x-csrf-token");
  const cookieToken = (await cookies()).get("asibi_csrf")?.value;
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  // Basic same-origin guard: allow missing headers (non-browser clients), block obvious cross-site origins.
  const originAllowed = !origin || !host || origin.includes(host);
  return Boolean(originAllowed && headerToken && cookieToken && headerToken === cookieToken);
}
