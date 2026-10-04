# GrowLand — Glass UI v2

## Visual direction
- Reworked the visual layer around the actual GrowLand botanical identity: deep forest/ink surfaces, leaf green, and a restrained neon-lime accent.
- Added a final shared glassmorphism layer with translucent gradients, subtle edge highlights, blur/saturation, soft depth, and consistent radii.
- Unified public landing sections, top navigation, authentication, member directory, growth dashboard, admin panels, forms, cards, modals, and feedback states.
- Kept Persian-first RTL presentation while retaining product terms and the existing GrowLand logo asset.

## Responsive behavior
- Added explicit desktop/tablet/mobile breakpoints at 1180px, 900px, 640px, and 380px.
- Mobile hero, nav dropdown, section grids, signup/signin forms, dashboard KPIs, member cards, admin lists, and dialogs reflow for narrow screens.
- Added safeguards against horizontal overflow and improved keyboard focus and reduced-motion behavior.

## Main changes
- `src/glass-v2.css`: final design-system overrides and responsive glass UI.
- `src/main.jsx`: loads the new visual layer after existing styles; routes, auth state, API contracts, and panel functionality are preserved.
- `index.html`: browser theme color now matches the forest-green palette.

## Preserved behavior
- Existing routes: `/`, `/signup`, `/signin`, `/members`, `/dashboard`, `/admin`.
- Existing auth/API flows, member/dashboard/admin functionality, logo and public assets.
- Existing local JSON / Vercel Blob storage architecture. No database has been introduced.

## Verification
- JSX parser validation: run before packaging.
- CSS parser validation: run before packaging.
- A full Vite production build still requires installing the project dependencies with `npm install`; `node_modules` is not included in this source archive.

## Deployment reminder
- `.env` is not included. Configure the required environment variables in the hosting provider and use fresh secrets. After extracting: `npm install`, `npm run build`, then test `npm run dev` before deploying.
