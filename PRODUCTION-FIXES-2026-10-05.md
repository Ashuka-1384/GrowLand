# GrowLand — Production Fix Pass (2026-10-05)

## What was fixed

### 1. Member deletion
The previous implementation marked members with `deletedAt`, while the admin overview still returned the whole member array. This made deleted users appear to remain in the admin panel.

The new behavior removes the account from the active member collection, cleans up member-owned operational records, and keeps an audit event for traceability.

### 2. Admin promotion
The previous implementation changed `member.role` but authorization relied on the role embedded in the member's existing JWT. A promoted member could therefore immediately receive `403` until signing in again.

Admin authorization now checks the member's current persistent role. The member also receives an in-app notification and `/api/auth/me` returns the new role after refresh.

### 3. Registration/profile data
The registration form already collected several fields, but the dashboard profile editor only exposed a subset. The profile API and dashboard now use the same core data model for:

- name
- phone
- age
- city
- primary skill
- current skill level
- weekly time
- main goal
- three-month goal
- why GrowLand
- about

### 4. Notifications
Added persistent notifications to the existing JSON/Blob domain model without introducing a new database dependency.

Endpoints:
- `GET /api/member/notifications`
- `PATCH /api/member/notifications/:id/read`

### 5. Storage freshness
The previous 750ms in-process cache could make a successful mutation look like it had not been saved when another request/container read a stale snapshot. The cache window is now disabled for production correctness.

## Deployment

This project is designed to remain compatible with the existing Vercel deployment flow:

1. Replace the project files with this project.
2. Keep the existing Vercel project/repository configuration.
3. Configure the required environment variables from `.env.example` in Vercel.
4. Commit and push to GitHub.
5. Vercel should build using `npm run build` and deploy the `dist` directory.

Do not commit `.env` or production secrets.

## Verification performed

- Node server syntax: PASS
- Node storage syntax: PASS
- TypeScript JSX parser: PASS
- structural/typecheck script: PASS
- smoke test: PASS
- regression checks for deletion, admin role propagation, notifications and profile data: PASS

A complete Vite production bundle could not be executed in the current environment because dependencies are not installed and `npm install` timed out. No claim of a completed browser/runtime production build is made from this environment.
