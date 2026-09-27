# GrowLand Vercel Audit — 2026-09-27

## Result

The uploaded project was reviewed at source level and hardened for Vercel production.

Checks passed:

- TypeScript/TSX parser check: PASS (32 source files)
- Autoprefixer warning reproduction: PASS (0 warnings)
- Scan for `justify-content: end`, `align-items: end`, `align-self: end`: PASS
- JSON validation: PASS
- Project metadata/config validation: PASS
- Local JSON storage adapter runtime test: PASS
- Vercel Blob storage adapter runtime test: PASS
- 8-way concurrent optimistic-concurrency storage test: PASS

## Changes made

1. Replaced Vercel-unsafe production writes to `data/store.json` with private Vercel Blob storage.
2. Kept `data/store.json` as the local-development / initial-seed source.
3. Added `@vercel/blob` 2.8.0 and Vercel environment variables to `.env.example`.
4. Added optimistic concurrency control with ETag retries for shared Blob updates.
5. Added `useCache: false` for store reads so current state is not hidden by the Blob CDN cache.
6. Fixed the admin UI bug where the master-admin action was hidden because `/api/auth/me` intentionally omitted the phone field.
7. Added an explicit `isMasterAdmin` session flag instead of exposing the master phone to the client.
8. Hardened public member API responses so phone numbers, private application answers, admin flags, and internal visibility fields are not sent publicly.
9. Added `no-store` headers to authenticated state responses.
10. Added stronger request validation for signup, report submission, XP updates, skills, admin changes, and member state changes.
11. Fixed the signup `input` change-event type annotation.
12. Added an ESLint configuration and matching Next.js ESLint dependencies.
13. Kept Next.js at 14.2.35, the patched 14.x release used by this project.
14. Added deployment verification instructions and build version `2026-09-27-fix-03`.

## Important deployment requirement

In Vercel Production:

- Connect a **Blob store** to the project.
- Ensure `BLOB_READ_WRITE_TOKEN` exists in Production.
- Set `SESSION_SECRET` to a long random secret.
- Optionally set `MASTER_ADMIN_PHONE` only when the master-admin phone should differ from the seeded value.

The application automatically continues to use `data/store.json` for local development and uses Vercel Blob when `VERCEL=1`.

## Verification limitation

A full `npm install` followed by the real Next.js production build could not be executed in this analysis environment because the package installation process timed out while fetching dependencies. The source was therefore additionally validated with TypeScript parser diagnostics, CSS/Autoprefixer processing, JSON/config checks, and runtime tests of the storage layer. The final Vercel build should still be run after dependencies are installed by Vercel.

## Security note

The existing login flow is still intentionally phone-only. This means knowledge of a member's phone number is sufficient to impersonate that member. This is a product-level security limitation, not a Vercel build problem. For a real public production service, add OTP, password, magic-link, or SSO authentication.
