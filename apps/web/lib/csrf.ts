export async function ensureCsrfToken(): Promise<string> {
  const existing = document.cookie.split('; ').find((part) => part.startsWith('asibi_csrf='))?.split('=')[1];
  // Reuse cookie token when available to avoid extra network calls.
  if (existing) return decodeURIComponent(existing);
  await fetch('/api/auth/csrf', { credentials: 'include' });
  const fresh = document.cookie.split('; ').find((part) => part.startsWith('asibi_csrf='))?.split('=')[1];
  return decodeURIComponent(fresh ?? '');
}

