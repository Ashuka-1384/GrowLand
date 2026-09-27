# GrowLand — React + Node.js + JSON

A mobile-first GrowLand MVP built with **React (Vite)** on the client and **Node.js + Express** on the server. It intentionally uses **no database**. All application data is stored in `server/data/data.json`.

## Included
- Landing/about section
- GrowLand activity domains
- Top members
- Announcements
- Member ranking and all-members directory
- Passwordless Iranian phone sign-in/sign-up (`+98` default)
- Member growth dashboard
- Skill XP, radar chart, 7-day growth chart
- Roadmap/plan and “ready for work” status
- Admin reports and member management
- XP/level/skill management
- Admin promotion/removal by the first owner admin
- JSON persistence

## Run locally
```bash
npm install
npm run dev
```

Client: `http://localhost:5173`
API: `http://localhost:4000`

For a production client build:
```bash
npm run build
```

## First admin
The initial admin is seeded with:
`+989333167279`

There is intentionally **no SMS verification or password** in this MVP, per the project requirements.

## Important Vercel note
This project is intentionally database-free. Vercel serverless functions do **not** provide durable writable local filesystem storage between invocations. Therefore `data.json` is suitable for local/self-hosted Node deployment, but durable writes on Vercel require an external persistent storage service (which would conflict with the strict “no database” requirement).

The code is structured so the API can later be moved to a persistent Node host without changing the React UI.

## Vercel deployment configuration
A `vercel.json` is included. The frontend can be built by Vercel and the Express API can run as a Vercel Node function. **However, JSON writes are not durable on Vercel serverless storage.** This is a platform constraint, not a code bug. If the strict no-database rule remains, use a persistent Node host for the API and Vercel for the frontend, setting `VITE_API_URL` to the API URL.
