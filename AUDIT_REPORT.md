# GrowLand Vercel Audit — 2026-09-27 (fix-04)

## Root causes addressed

1. The reported `autoprefixer: end value has mixed support, consider using flex-end instead` warning was tied to the global CSS/PostCSS pipeline. The project now uses an explicit PostCSS config with Autoprefixer 10.4.19, which removed that warning in Autoprefixer.
2. The `npm run build` command was exiting with code 1 later in the build pipeline, after `Compiled successfully`, during the TypeScript validity check. The signup form had the HTML input/textarea `ChangeEvent` types swapped. Both annotations are now correct.
3. Vercel production writes no longer depend on the function filesystem. Persistent state uses Private Vercel Blob, while `data/store.json` is the local development/initial seed.
4. If the Blob file does not exist on first production request, the app now initializes it from the local seed and handles concurrent first-run initialization safely.

## Static verification

- JSON syntax validation: PASS
- CSS scan for logical `start`/`end` alignment values: PASS
- TypeScript source validation with a strict local stub environment: PASS
- API route inventory vs client fetch usage: PASS
- Production configuration sanity checks: PASS

## Expected Vercel configuration

- Framework: Next.js
- Node: >=18.17.0
- Production: `BLOB_READ_WRITE_TOKEN` required
- Production: `SESSION_SECRET` required
- Optional: `MASTER_ADMIN_PHONE`

## Important distinction

A webpack/PostCSS warning by itself does not produce `Command "npm run build" exited with 1`. In the supplied log, `Compiled successfully` is reached and the build then enters the type-check stage. That is why the signup TypeScript defect is the critical build blocker here.

## Final build note

A full Next.js build could not be executed in this isolated environment because npm dependency downloads timed out. Vercel itself will perform the real dependency installation and production build. The source-level strict type validation and all relevant configuration/static checks pass.
