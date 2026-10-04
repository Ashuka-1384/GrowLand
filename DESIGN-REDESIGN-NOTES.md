# GrowLand — Neon Turquoise Glassmorphism Refinement

## Visual direction
- Deep blue-green / ink backgrounds, neon turquoise as the primary accent, and restrained cyan secondary highlights.
- Layered glass surfaces with subtle borders, controlled blur, quiet highlights and softer shadows; reduced reliance on lime-green glows.
- A more consistent Persian-first type scale and section rhythm, with improved line length and balanced heading wraps.
- Corrected logo cropping in the top navigation and hero emblem so the leaf mark reads cleanly inside its frame.
- Persianized prominent UI microcopy that had mixed English labels into Persian sections, while preserving brand names and product terms such as GrowLand and XP.
- Shared styling across the public home page, membership and login forms, member directory, personal growth dashboard, admin panel, notices, dialogs, loading/error states and controls.

## Responsive behavior
- Desktop, tablet and phone layouts use explicit breakpoints and minmax-based grids to reduce squeeze/overflow.
- Mobile navigation remains an accessible dropdown with `aria-expanded` and `aria-controls`.
- Member/admin side navigation can collapse into compact horizontally scrolling controls at smaller widths.
- Hero logo, floating cards, headlines, forms, member rows, charts, modals and actions have tuned mobile dimensions down to 320px.
- Includes visible keyboard focus, a skip link, and reduced-motion support.

## Main files
- `src/main.jsx`: retained existing React routes, auth flow, API calls and platform capabilities; refined visible copy for Persian consistency.
- `src/redesign.css`: unified neon turquoise glassmorphism design system and final responsive refinements.
- `index.html`: updated browser theme color to match the teal palette.

## Preserved behavior
- Existing route map (`/`, `/signup`, `/signin`, `/members`, `/dashboard`, `/admin`), auth calls and API contracts.
- Existing member/dashboard/admin capabilities and public assets.
- Existing local JSON / Vercel Blob storage architecture.

## Security note
- The distributable project excludes `.env`. Copy `.env.example` to `.env` for local development and use fresh deployment secrets in your hosting environment. Do not publish a live `.env` file.

## Verification
- JSX parsing: passed using the globally available TypeScript parser.
- CSS parsing: passed using the globally available PostCSS parser.
- HTML Persian language / RTL attributes: verified.
- Full Vite production build and browser-based screenshot test were not completed because `npm install` timed out in this environment. In the project directory, run `npm install`, `npm run build`, then `npm run dev` before deployment.
