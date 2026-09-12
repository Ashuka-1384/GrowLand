# GrowLand Responsive Audit

## Primary issue
The mobile experience could expose horizontal overflow from viewport-sized/fixed decorative elements and from content that could not safely shrink inside the profile modal.

## Changes applied
1. Root/document hardening: `html`, `body`, `#root`, `.app`, `main`, sections and containers are width-constrained; horizontal overflow is clipped at the document boundary.
2. Modal hardening:
   - `width: min(600px, calc(100vw - 32px))` on desktop/tablet.
   - `max-width: 100%`, `min-width: 0`, `overflow-x: hidden`.
   - Mobile modal is exactly viewport-width and uses `svh` plus safe-area padding.
   - Long names/goals and dynamic strings can wrap instead of widening the modal.
3. Modal internals:
   - Header/identity/skill rows can shrink.
   - Progress cards use `minmax(0, 1fr)`.
   - History rows use `minmax(0, 1fr)`.
   - Narrow screens reduce avatar/badge dimensions and stack the custom XP action safely.
4. Page components:
   - Member cards, leaderboard items and their flexible children now have safe `min-width: 0`.
   - Header gets an extra narrow-screen layout so logo/actions cannot force page width.
   - Small-screen sections/admin controls have tighter spacing and full-width controls.
5. Data architecture was intentionally preserved: JSON remains the deploy-time source of truth and localStorage remains browser-local for demo XP edits.

## Verification
- `node scripts/validate-data.mjs` passes: 16 users, version 1.
- The environment did not contain installed npm dependencies. `npm run build` therefore could not be executed because Vite was unavailable locally; `npm install --offline` also could not proceed because the dependency packages were not cached.
