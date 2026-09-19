# Security Implementation & Compliance Architecture (`SECURITY.md`)

This document formally maps the 14 mandatory security rules (S1–S14) from the Master Specification to the technical implementations in the codebase.

---

| Rule | Requirement Summary | Implementation & File Reference |
|---|---|---|
| **S1** | Code & verification logic NEVER leaked to client JS, HTML, API response, sourcemap, repo, logs, comments | Salted hash only on server; server-only route handler in `app/api/submit/route.ts`; scan enforced by `scripts/check-bundle-secrets.mjs`. |
| **S2** | Store salted slow hash in env; scrypt parameters fixed; timingSafeEqual | `lib/hash.ts` uses `crypto.scryptSync(code, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })` with `crypto.timingSafeEqual`. |
| **S3** | Authoritative timestamps from Postgres (`clock_timestamp()`) | `supabase/migrations/0001_init.sql` & `0002_views_functions.sql` use `clock_timestamp()`. `lib/time.ts` syncs client offset via RTT midpoint. |
| **S4** | Binary responses only (`correct` or `incorrect` + cooldown/rank); no partial clues | `app/api/submit/route.ts` strictly returns `{ result: 'correct', rank, solvedAt }` or `{ result: 'incorrect', attemptsBeforeCooldown, cooldownSeconds }`. |
| **S5** | Constant-work execution; always run scrypt hash even if input invalid or rate-limited | `app/api/submit/route.ts` computes dummy scrypt hash with timingSafeEqual before sending 400 or 429 responses to prevent timing attacks. |
| **S6** | DB access through server Route Handlers with service-role key; RLS enabled on every table with NO public policies | `supabase/migrations/0003_rls.sql` revokes all public/anon/authenticated access. `lib/supabase-server.ts` runs exclusively on server runtime. |
| **S7** | Signed JWTs (`jose`, HS256) in `httpOnly`, `Secure`, `SameSite=Strict`, `Path=/` cookies; distinct audiences and TTLs | `lib/auth.ts`: `mb_team_token` (audience `mystery-team`, 8h TTL) and `mb_admin_token` (audience `mystery-admin`, 4h TTL). |
| **S8** | PINs and admin password stored hashed (scrypt); rate-limited login endpoints (5 attempts / 5 min) | `app/api/login/route.ts` and `app/api/admin/login/route.ts` with constant-time dummy verification on nonexistent users; rate limited via `lib/rate-limit.ts`. |
| **S9** | CSRF protection: require `Content-Type: application/json`, verify `Origin` against `SITE_ORIGIN` on mutating routes | `lib/csrf.ts` / middleware validation in `app/api/submit/route.ts`, `app/api/login/route.ts`, `app/api/admin/*/route.ts`. |
| **S10** | Strict security headers: CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Permissions-Policy` | `next.config.ts` configures strict Content Security Policy, frame-ancestors 'none', disabling camera, microphone, geolocation. |
| **S11** | Never store raw wrong attempt; store truncated HMAC-SHA256(`SESSION_SECRET`, attemptCode) only | `lib/hash.ts` `hashAttempt(code)` returns first 16 hex chars of HMAC-SHA256. Stored in `submissions.attempt_hash`. |
| **S12** | Zod input validation on every route; reject unknown fields; cap body size at 2KB | Zod schemas with `.strict()` on all request payloads; body size length check enforced. |
| **S13** | Safe logging: logs never contain attempts, codes, secret hashes, PINs, or cookies | `lib/safe-log.ts` strips sensitive keys (`code`, `pin`, `token`, `cookie`, `secret`, `hash`) before writing to console or database `audit_log`. |
| **S14** | `scripts/check-bundle-secrets.mjs` scans `.next` bundle for secrets and exits non-zero if detected | Script checks `.next/` directory for `CODE_HASH`, `CODE_SALT`, `SESSION_SECRET`, `SERVICE_ROLE`, and `CHECK_CODE`. |
