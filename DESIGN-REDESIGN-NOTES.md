# GrowLand — Glass UI v3

## Design direction
- Persian-first RTL design built around the GrowLand logo: deep forest surfaces, botanical greens, restrained leaf-lime highlights, and high-contrast typography.
- Glassmorphism applied consistently to navigation, landing sections, signup/signin, member directory, growth dashboard, admin center, cards, forms, and dialogs.
- Removed the leftover cyan/teal palette from the older style iteration so public and private areas share one coherent brand system.
- Preserved the supplied logo asset and the existing content hierarchy while improving spacing, borders, surface depth, hover, focus, and empty/loading/error states.

## Responsive behavior
- Breakpoints cover desktop, tablet, mobile, and very narrow mobile screens (1180px, 900px, 640px, and 380px).
- Navigation collapses to an accessible mobile menu with constrained height and its own scrolling behavior.
- Hero, timeline, forms, member cards, dashboard metrics, admin lists, profile editing, and modal actions reflow on narrow screens.
- Long admin content and member details wrap safely; modal content and horizontal dashboard navigation remain scrollable on touch devices.
- Includes keyboard-visible focus, skip navigation, reduced-motion support, and a higher-opacity fallback when backdrop filters are not supported.

## Preserved functionality
- Routes remain: `/`, `/signup`, `/signin`, `/members`, `/dashboard`, `/admin`.
- Existing auth session, API contracts, member directory, profile, growth activities, submissions, assessment, and admin workflows are kept.
- Existing JSON/local and private Vercel Blob storage approach is unchanged; no database dependency has been added.
- The `.env` file is not included in the source package. Secret samples use placeholders and local environment files are ignored by Git.

## Verification
- JSX transpilation/parser validation: passed.
- CSS parser validation for `styles.css`, `redesign.css`, `glass-v2.css`: passed.
- Node syntax checks for server, API, and utility scripts: passed.
- `package.json`, `vercel.json`, and seed JSON validity: checked before packaging.
- Full Vite production build could not be run in this environment because npm registry DNS resolution failed (`EAI_AGAIN`). Run `npm install` and `npm run build` locally or in CI before deployment.

## Deployment
1. Extract the archive and open `growland-project/` as the project root.
2. Set the required environment variables from `.env.example` using fresh values; never commit `.env`.
3. Run `npm install` and `npm run build`.
4. Test signup/signin, a member dashboard, and admin workflows in a staging deployment before replacing the live version.
