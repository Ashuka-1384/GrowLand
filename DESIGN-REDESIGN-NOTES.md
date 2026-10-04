# GrowLand — Glass Experience v4

## What changed in this pass
- Rebuilt the homepage hero visual from a static, oversized logo surrounded by rings into a detailed glass dashboard preview showing weekly progress, XP, evidence, skills, and recent activity.
- Changed the global navigation from a full-width bar into a floating, translucent glass capsule with a responsive menu.
- Reworked the shared design layer for the philosophy cards, growth timeline, community cards, member directory, signup/signin, member growth dashboard, admin sidebar, management lists, forms, and dialogs.
- Consolidated the palette around the supplied GrowLand mark: forest green, translucent botanical surfaces, leaf-lime highlights, cool pale text, and subtle emerald light. The fresh style is in `src/experience.css` and is loaded last to override the earlier design iterations.
- Preserved API endpoints, React routes, form behavior, authorization, and storage implementation. No new database was introduced.

## Responsive behavior
- Breakpoints cover desktop, tablet, mobile, and narrow mobile screens (1180px, 900px, 640px, and 380px).
- At mobile sizes, the primary navigation becomes a closed-by-default glass menu; the hero stacks; signup fields, KPI cards, journey tiles, member cards, admin lists, and modal actions reflow to fit the screen.
- Long names and submitted evidence wrap safely; admin/member side navigation scrolls horizontally when needed; modals retain internal scrolling.
- Visible keyboard focus, skip navigation, reduced-motion support, and a solid-surface fallback for browsers without `backdrop-filter` are retained.

## Preserved functionality
- Routes remain `/`, `/signup`, `/signin`, `/members`, `/dashboard`, and `/admin`.
- Auth/session behavior, public member directory, member profile, growth activities, evidence submissions, assessments, and admin workflows remain in `src/main.jsx` and the existing server/API files.
- The existing JSON/local and private Vercel Blob storage approach is unchanged. No database dependency was added.
- The `.env` file is not included. Configure local/deployment secrets from `.env.example`; never commit live secrets.

## Verification status
- TypeScript JSX transpilation/syntax pass: passed.
- CSS parser checks for `styles.css`, `redesign.css`, `glass-v2.css`, and `experience.css`: passed.
- Node syntax checks for server, API, and utility scripts: passed.
- Package JSON, Vercel config, and seed JSON: parsed successfully.
- A full Vite production build is **not confirmed** in this environment because dependency installation did not complete within the available time. Run `npm install` followed by `npm run build` before deployment, then test signup/signin, member dashboard, and admin workflows on staging.

## Deployment
1. Extract the archive and open `growland-project/` as the project root.
2. Set environment variables from `.env.example` with actual deployment values.
3. Run `npm install` and `npm run build`.
4. Test all main routes and auth/member/admin workflows in a staging deployment before replacing the live version.
