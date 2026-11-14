# AGENTS — Sankofa Rent

> Standalone final-year project: not connected to any vendor, editor or AI gateway.
> The repo builds and deploys with just Node, npm, the Convex CLI and Wrangler.

## Authentication frontend

- Keep shared auth fields and layout in `src/components/auth/AuthLayout.tsx`, with pure validation in `src/lib/auth-validation.ts`, so all auth pages share accessible controls and testable rules.
- Auth is email + password through Convex (`@convex-dev/auth`); submissions must surface real server errors rather than simulate a session or successful delivery.
- Convex backend code lives in `convex/` (excluded from the app tsconfig and eslint) so it can be deployed with `npx convex dev` without affecting the frontend build.

## Backend & deployment

- **npm only** — no bun/pnpm/yarn; `package-lock.json` is the source of truth (`bun.lock`/`bunfig.toml` were removed 2026-11-14 to unbreak CI).
- Deployments are driven by gitignored env files, never from the repo for secrets: `.env.local` = dev
  (`dev:adorable-pig-437`), `.env.production.local` = prod (`prod:usable-penguin-827`).
  `npx convex deploy --env-file <file>` for prod; `npx convex dev --once` for dev.
- **Frontend** (Cloudflare Workers, Nitro `cloudflare-module`): production is deployed by
  **Workers Builds** on pushes to `main`, to Worker `final-year-rent-project` — live at
  https://final-year-rent-project.edimamfaidol.workers.dev. The `edith-nonnon-project` worker
  was the manual-deploy target and does not reflect the deployed site anymore; the two were
  never aligned (the Git-connected build always named its script `final-year-rent-project`).
  `npm run build` → `npx wrangler deploy` (root `wrangler.jsonc`) remains for emergencies only.
  The public prod `VITE_CONVEX_URL` is pinned in the committed `.env.production` (not a secret).
- **Branding** is a global singleton (`convex/branding.ts` + `src/lib/branding.tsx`), publicly
  readable, admin-writable only. Route `head()` titles are build-time static; `BrandingEffects`
  rewrites `document.title` at runtime. Keep both `DEFAULT_BRANDING` copies in sync.
- **Roles**: first account on a deployment becomes `admin`, the rest `user`. Admins only get the
  Branding tab; the server enforces it via `requireAdmin` — UI gates are not authorization.
- Operator migrations live in `convex/migration.ts` — promote admins
  (`migration:backfillAdmin`), force one admin (`setAdmin`), rename the default brand
  (`renameDefaultBrand`), delete a draft invoice by number. Run them with `--env-file` for prod.
