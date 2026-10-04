# GrowLand — Redesign Notes

## Visual direction
- Premium forest-green palette drawn from the GrowLand leaf mark, balanced with soft white glass highlights and botanical lime accents.
- Layered glassmorphism: blur, translucent surfaces, restrained borders, inner highlights and deep soft shadows.
- Stronger Persian-first typography hierarchy, more spacious sections, cleaner action hierarchy and consistent component styling.
- One visual system across the public landing page, sign-up/sign-in, member directory, personal growth dashboard, admin control center, forms, modals, status messages and loading/error states.

## Responsive behavior
- Desktop-first grids collapse to two-column and single-column layouts at tablet/mobile breakpoints.
- Compact navigation becomes an accessible dropdown with `aria-expanded` and `aria-controls`.
- Dashboard/admin side navigation switches to horizontally scrollable controls on smaller viewports.
- Form fields, action buttons, member cards, admin member rows, charts, modals and CTA sections adapt for narrow screens down to 320px.
- Added a keyboard-accessible skip link and visible focus states; reduced-motion preferences are respected.

## Main files
- `src/main.jsx`: improved mobile-navigation accessibility, semantic main/skip link, dashboard anchor targets and Persian dashboard labels; existing routes and API contracts remain intact.
- `src/redesign.css`: new cohesive glassmorphism design system and responsive overrides.
- `index.html`: updated browser theme color and page title.

## Preserved behavior
- Existing React route map, authentication and API calls.
- Existing member/dashboard/admin capabilities and public assets.
- Existing local JSON / Vercel Blob storage architecture.

## Security note
- The distributable project intentionally excludes `.env`. Copy `.env.example` to `.env` for local development and use fresh deployment secrets in your hosting environment. Never publish a live `.env` file.

## Build verification
- JSX/JavaScript syntax was checked with the globally available TypeScript transpiler. A full Vite build could not be run in this environment because npm dependency installation did not complete. Run `npm install` followed by `npm run build` in the project folder before deployment.
