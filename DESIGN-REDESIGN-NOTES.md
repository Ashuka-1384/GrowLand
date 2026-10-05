# GrowLand — polished production refinement

## What changed
- Consolidated the six CSS layers into `src/styles.css` so runtime styling no longer depends on import order.
- Reworked mobile layout for 320–430px widths, especially `/signup`, with true single-column form flow and touch-safe controls.
- Tightened the desktop header and reduced decorative glow/blur intensity.
- Added explicit loading / success / empty / error states to public members and announcements.
- `/api/auth/me` now returns `{ user: null }` with HTTP 200 for anonymous sessions, removing noisy 401 console errors.
- Removed `dangerouslySetInnerHTML` from the SVG icon renderer.
- Added accessible focus states, generated form control IDs, autocomplete attributes, and improved Persian initials normalization.
- Switched the logo asset to WebP and removed the runtime Google Fonts dependency.
- Added Node 22 engine pin, structural check/typecheck/smoke-test scripts, and a datastore revision counter.
- Production Blob-backed reads no longer use the short-lived datastore cache; correctness is preferred over the previous 750ms cache window so member/admin mutations are less likely to appear stale.

## Product behavior preserved
Routes, API contracts, authentication model, XP/level rules, and the GrowLand journey remain intact. The visual language stays deep green + lime + glass, but with less ornament and stronger hierarchy.

## Validation
Run:
```bash
npm install
npm run check
npm run typecheck
npm run test
npm run build
```
Then stage the Vercel deployment and verify `/`, `/signup`, `/signin`, `/members`, `/dashboard`, and `/admin` at desktop and 320–430px widths.
