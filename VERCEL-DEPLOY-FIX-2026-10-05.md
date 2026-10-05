# GrowLand — Vercel deployment fix (2026-10-05)

## What caused the deployment failure

The previous `vercel.json` used a JavaScript-style negative-lookahead regular expression inside a Vercel rewrite source:

`/((?!api/)(?!.*\\.[^/]+$).*)`

Vercel's `rewrites.source` uses Vercel's routing/path-to-regexp syntax; this expression is not a valid source pattern for the deployment configuration and caused:

`Invalid vercel.json file provided`

## Fix

The routing now uses supported catch-all path parameters:

- `/api/:path*` → `/api/index.js`
- `/:path*` → `/index.html`

The API rule comes first so API requests are routed to the Express serverless function before the SPA fallback.

Static files produced by Vite remain available from `dist` and are not replaced by the SPA fallback when the file exists in the deployment output.

## Deployment

1. Replace the repository contents with this version.
2. Commit and push to the production branch.
3. Wait for Vercel to build the new commit.
4. If Vercel shows an old failed deployment, use Redeploy only after the corrected commit is present.

Do not change the existing production environment variables.
