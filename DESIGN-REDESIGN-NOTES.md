# GrowLand — Neo Glass redesign

## Visual direction
- Added `src/neon-glass.css` as the final, active design layer for the site and its member/admin experiences.
- Palette follows the supplied GrowLand logo with a practical 60/30/10 balance: deep forest/near-black as the main canvas, translucent botanical-green glass surfaces for secondary structure, and lime neon for interactive emphasis.
- The UI uses layered glass cards, thin luminous borders, restrained emerald/lime glow, a floating navigation capsule, clearer typography hierarchy, and more distinct hero, content, and management areas.
- The supplied logo image remains the source of truth. The logo tile now contains the whole source image using `object-fit: contain`; it is not zoom-cropped or shifted out of its box. The separate GrowLand wordmark remains legible next to it.

## Coverage
- Public home page, growth journey, principles, community ranking, skill areas, announcements, and main CTA.
- Sign-up/onboarding and sign-in forms, shared fields and error/empty states.
- Member directory and public member cards.
- Member growth dashboard, KPI cards, activities/submissions, charts, profile/roadmap surfaces.
- Admin overview, member list, reports, activity creation/review, admin role controls, and member modal.
- Responsive breakpoints for desktop, tablet, mobile, and narrow mobile, including collapsed navigation, stacked forms/layouts, touch-sized buttons, overflow-safe member names and reports, and compact admin navigation.

## Functional preservation
- Existing React routes and API behavior are retained: `/`, `/signup`, `/signin`, `/members`, `/dashboard`, and `/admin`.
- No additional database or new runtime dependency was introduced.
- Server/API source and authentication logic were not intentionally altered.

## Validation
- All five CSS layers were parsed successfully with PostCSS, including the new `neon-glass.css` layer.
- Node syntax checks passed for the server, store, API entry, and validation utility.
- A Vite production build was not confirmed because dependency installation timed out in this environment. Run `npm install` and `npm run build` locally or in CI before deploying; then test registration/login, mobile navigation, member dashboard submissions, and admin workflows on staging.

## Deployment
1. Extract the archive and open `growland-project/` as the project root.
2. Configure real environment variables using `.env.example`; do not commit live secrets.
3. Run `npm install` then `npm run build`.
4. Preview and test the build on desktop, tablet and mobile before replacing the live deployment.
