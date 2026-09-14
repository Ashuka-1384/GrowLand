# GrowLand — Visual Redesign

This version keeps the existing React/Vite data and interaction model while rebuilding the visual layer around a premium futuristic product aesthetic.

## What changed

- Rebuilt the global visual system: deeper blue-black surfaces, layered glass panels, softer borders, stronger hierarchy, and a more restrained green/cyan accent system.
- Reworked the hero into a cinematic dashboard-style composition with animated growth pulse, data visualization, floating metric badges, responsive layout, and pointer-reactive lighting.
- Reworked member cards into interactive membership/profile cards with 3D tilt, cursor-reactive highlight, animated avatar treatment, tier indicator, richer XP presentation, skill stack, and clearer profile affordance.
- Reworked stats, leaderboard, search, filters, loading states, and footer to match the new design language.
- Rebuilt the member modal styling as a premium profile panel with stronger information hierarchy and responsive controls.
- Added consistent motion primitives for entrance, shimmer, pulse, floating elements, modal transitions, and progress visuals.
- Preserved responsive/mobile behavior and reduced-motion support.
- Preserved the existing data, filtering, sorting, member selection, XP demo controls, persistence, and recovery behavior.

## Validation

- `node scripts/validate-data.mjs` passes: 16 users, version 1.
- A production build could not be executed in this environment because npm dependency installation timed out while fetching packages; no source dependency changes were introduced.

## Revision 2 — immersive member cards + mobile polish

- Replaced the previous small initials-only avatar treatment with a prominent profile-photo area on every member card.
- Added `public/profile-images/` as the dedicated profile-image directory.
- Added `profileImage` and `profileAlt` to every record in `src/data/users.json`; data version bumped to `2` so existing browser-cached demo data refreshes to the new schema.
- Member cards now have equal visual height, a large photo hero, animated image zoom, light sweep, border highlight, scan line, breathing ambient glow, richer level treatment, and a bottom CTA.
- Member profile modal and Top Growers now reuse the profile images.
- Removed native browser white button styling from the header and filter controls so the UI stays consistent with the dark design system.
- Reworked responsive breakpoints: one-column member cards on phones, tighter hero composition, stacked mobile controls, scrollable filter pills, compact leaderboard rows, and safer narrow-screen spacing.
- Added a profile-image README explaining how to replace the bundled demo portraits with real member portraits while preserving the JSON contract.
