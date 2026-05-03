# Asibi

Asibi is an offline-first climate triage Progressive Web App for community health workers.

## Current bootstrap

- Next.js mobile-first web app (`apps/web`)
- Shared triage schema and evaluator (`packages/shared`)
- Triage API route with strict validation
- Offline case storage using IndexedDB (`apps/web/lib/cases.ts`)
- Background sync agent with lock + retry-window checks (`app/sync-agent.tsx`)
- Sync queue metadata with exponential backoff support (`apps/web/lib/sync.ts`)
- Auth-required sync flow with Supabase token verification + refresh retry
- Auth API endpoints: `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh` using httpOnly cookies
- Supervisor dashboard (`/dashboard`) + role-gated summary API with live Supabase aggregate counts
- Health and audit endpoints: `/api/health`, `/api/audit`
- Multilingual starter: English, Hausa, Yoruba, Igbo on Home screen
- Security response headers configured in `next.config.ts`
- Supabase REST sync support using server env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`)
- Service worker registration + app-shell caching stub (`public/sw.js`)
- Supabase migrations include base schema + least-privilege RLS policies for users/cases/audit logs
- RLS verification script: `tests/run-rls-verification.sh` (requires `DATABASE_URL`)
- CI workflow runs typecheck, build, and baseline test scripts

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
