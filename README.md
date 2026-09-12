# GrowLand — Growth Dashboard

> **Growth made visible.** Track your growth, build real skills, and prove your progress.

A professional, modern, and fully responsive Member Directory for GrowLand — a Growth Operating System that turns effort into evidence and evidence into opportunity.

---

## Overview

GrowLand Dashboard displays every member's growth journey in one place:

- **Level** & **XP** with animated progress bars
- **Skill Stack** with per-skill levels
- **Real-time Search** across name, city, goal, and skills
- **Filters** by level tier, city, and skill
- **Sorting** by level, XP, or name
- **Leaderboard** of Top Growers
- **Profile Modal** with full growth details
- **Community Stats** calculated live from member data
- All data managed via a single `users.json` — no database needed

---


## Progression & XP

GrowLand now uses XP as the single source of truth for progression:

- Level 1 starts at 0 XP and each level requires 1,000 XP.
- Maximum progression is Level 50 / 50,000 XP.
- A member's level is calculated automatically from XP, so level/XP mismatches cannot occur.
- Demo Manager provides quick XP grants (+100, +150, +200, +500, +1,000) and custom XP awards.
- XP changes are stored in `localStorage` for the current browser and a recent XP activity log is kept per member.
- `Reset demo data` restores the original JSON dataset.

> **Important:** This repository remains a static Vite/React app. `users.json` is the deploy-time source of truth, while Demo Manager edits are stored only in the current browser via `localStorage`. Anyone who can open the public site can inspect or alter that local demo state, so it must not be treated as an authenticated admin panel. Shared production edits require a server-side API, authentication, and persistent storage.

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI & Component system |
| Vite | Build tool & dev server |
| JavaScript (ES2022) | Logic & utilities |
| CSS3 (Custom Properties) | Styling & animations |
| JSON | Data storage |
| Vercel | Deployment |

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/growland.git
cd growland

# Install dependencies
npm install
```

---

## Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Build

```bash
npm run build
```

The production build will be in the `dist/` folder.

---

## Preview Production Build

```bash
npm run preview
```

---

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel auto-detects Vite — no config needed
5. Click **Deploy**

### Option 3: Manual via Dashboard

1. Run `npm run build`
2. Drag the `dist/` folder to [vercel.com/new](https://vercel.com/new)

> **No environment variables or server config needed.** This is a fully static app.

---

## How to Manage Members

All member data lives in one file:

```


## Responsive audit — September 2026

The mobile layout was hardened for narrow devices (including 320–400px viewports):

- Removed horizontal page overflow at the root/layout level with `overflow-x: clip` and width constraints.
- Made containers, cards, grids and flex children shrink safely with `min-width: 0`.
- Reworked the member profile modal so its width can never exceed the viewport.
- Prevented modal content, skill rows, history rows, long names and goals from creating horizontal overflow.
- Added mobile-safe modal sizing with `svh`, safe-area bottom padding and touch scrolling.
- Optimized the modal header and level badge for narrow screens.
- Added narrow-screen header adjustments so the navigation cannot push the viewport horizontally.
- Improved small-screen admin controls so buttons remain usable without overflow.
- Kept the existing static JSON + localStorage architecture; no database or backend was introduced.

### Verification

`node scripts/validate-data.mjs` passes successfully for the bundled dataset (16 users, version 1).

The supplied environment did not contain the project's installed npm dependencies, so a local `vite build` could not be executed here. The package remains unchanged and is ready to build with `npm install && npm run build` before Vercel deployment.
