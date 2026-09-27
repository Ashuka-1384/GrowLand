# GrowLand runtime fix

The public pages call `getStore()` on Vercel, so a Vercel Blob store must be connected to this project.

This build supports both:
- Vercel Blob OIDC authentication (no `BLOB_READ_WRITE_TOKEN` required when the project/store is connected with OIDC).
- The legacy/static `BLOB_READ_WRITE_TOKEN` environment variable, when supplied.

Production environment variables:
- `SESSION_SECRET`: required; use a long random secret.
- `BLOB_READ_WRITE_TOKEN`: optional when Blob OIDC is active; otherwise set the Blob store token.
- `MASTER_ADMIN_PHONE`: optional; default is `+989333167279`.
- `GROWLAND_BLOB_PATH`: optional; default is `growland/store.json`.
- `GROWLAND_DATA_FILE`: local development only.

After adding/changing Vercel environment variables or connecting storage, redeploy the project.
