# GrowLand — Vercel build fix

## Build error fixed

The failing Vercel build was caused by an older version of `app/api/members/route.ts` directly reading `m.hiddenFromPublic` while the deployed `Member` type did not contain that property.

This package fixes the issue in two places:

- `lib/types.ts`: `Member.hiddenFromPublic` is now explicitly defined as a required boolean.
- `app/api/members/route.ts`: public-member filtering uses the shared `isPublicMember()` helper instead of directly accessing the property.

The project also contains the patched Next.js `14.2.35` dependency. Next.js officially lists 14.2.35 as the fixed 14.x release for the December 2025 RSC security update.

## Important Vercel step

The error log shows Vercel built GitHub commit `edd3276`. You must push this exact fixed project to the GitHub repository connected to Vercel, then deploy the newest commit. Redeploying the old `edd3276` commit will reproduce the same error.

## Local Windows commands

Run these in the project folder:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
```

Then commit and push:

```powershell
git add .
git commit -m "fix: resolve GrowLand Vercel TypeScript build error"
git push origin main
```

After the push, Vercel should automatically build the new commit. Verify the Vercel log shows the new commit hash, not `edd3276`.
