# GrowLand — Vercel 403 diagnosis & fix

## Code-level fixes in this release

1. `server/index.js` no longer prioritizes `x-forwarded-host` over the browser-facing `Host` header for same-origin validation. This prevents false `403 Origin مجاز نیست` responses when the Vercel alias and deployment host differ.
2. `vercel.json` SPA fallback only applies to extensionless application routes. Static assets such as `.css`, `.js`, `.webp`, `.png`, `.ico`, etc. are not rewritten to `index.html`.

## If CSS/assets still return HTTP 403

That response is generated before the application and therefore cannot be fixed in React/Express. Check:

**Vercel Dashboard → Project → Settings → Deployment Protection**

The screenshot URL is a generated `*.vercel.app` deployment URL. Vercel Deployment Protection can protect preview/deployment URLs, including static assets and API requests. For a public GrowLand site, use the public production domain/alias or disable protection for the environment that should be public.

Do not put Vercel protection credentials or bypass secrets into the frontend or Git repository.
