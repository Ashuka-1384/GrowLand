# GrowLand — Vercel build stabilization

## Fixed

The project source and lockfile pin Next.js to `14.2.35`.

The original TypeScript defect around `hiddenFromPublic` is fixed:
- `lib/types.ts` declares `Member.hiddenFromPublic`.
- `app/api/members/route.ts` uses the shared `isPublicMember()` helper.

The deployment configuration is now explicit:
- Vercel runs `npm ci`, so `package-lock.json` is used exactly.
- Vercel runs `npm run build`.
- Store-dependent server pages explicitly use the Node.js runtime.
- Raw `<img>` usages on the landing page/navbar are replaced with `next/image`.

## Verification

Expected local checks:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

`typecheck` and `lint` pass on the supplied project. The source-level build is compatible with Next.js 14.2.35; a full build in this isolated environment cannot complete when the Next.js native SWC package must be downloaded and external DNS/network access is unavailable.

## Important Vercel check

The Vercel log must show the new Git commit and `Next.js 14.2.35`.

If it shows `next@14.2.15`, Vercel is building a different/older source state. Do not troubleshoot application code until the deployment is confirmed to be using the current commit and lockfile.

## Required Vercel environment variables

- `BLOB_READ_WRITE_TOKEN`
- `SESSION_SECRET`
- optional `MASTER_ADMIN_PHONE`

Production state is stored in private Vercel Blob; `data/store.json` is the local seed.
