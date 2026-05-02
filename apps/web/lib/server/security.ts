import { cookies } from "next/headers";

export async function issueCsrfToken(response: { cookies: { set: Function } }) {
  // CSRF token is readable by client JS so it can be echoed in request headers.
  const token = crypto.randomUUID();
  response.cookies.set("asibi_csrf", token, { httpOnly: false, secure: true, sameSite: "lax", path: "/" });
  return token;
}

export async function verifyCsrf(request: Request): Promise<boolean> {
  const headerToken = request.headers.get("x-csrf-token");
  const cookieToken = (await cookies()).get("asibi_csrf")?.value;
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  // Basic same-origin guard: allow missing headers (non-browser clients), block obvious cross-site origins.
  const originAllowed = !origin || !host || origin.includes(host);
  return Boolean(originAllowed && headerToken && cookieToken && headerToken === cookieToken);
}
