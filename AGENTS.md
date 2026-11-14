<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Authentication frontend

- Keep shared auth fields and layout in `src/components/auth/AuthLayout.tsx`, with pure validation in `src/lib/auth-validation.ts`, so all auth pages share accessible controls and testable rules.
- Auth is email + password through Convex (`@convex-dev/auth`); submissions must surface real server errors rather than simulate a session or successful delivery.
- Convex backend code lives in `convex/` (excluded from the app tsconfig and eslint) so it can be deployed with `npx convex dev` without affecting the frontend build.

## Backend & deployment

- **npm only** — no bun/pnpm/yarn; `package-lock.json` is the source of truth (`bun.lock`/`bunfig.toml` were removed 2026-11-14 to unbreak CI).
- Deployments are driven by gitignored env files, never from the repo for secrets: `.env.local` = dev
  (`dev:adorable-pig-437`), `.env.production.local` = prod (`prod:usable-penguin-827`).
  `npx convex deploy --env-file <file>` for prod; `npx convex dev --once` for dev.
- **Frontend** (Cloudflare Workers, Nitro `cloudflare-module`): `npm run build` →
  `npx wrangler deploy` (root `wrangler.jsonc`, Worker `rentwise-ghana`), live at
  https://rentwise-ghana.edimamfaidol.workers.dev. Pushes to `main` trigger Workers Builds.
  The public prod `VITE_CONVEX_URL` is pinned in the committed `.env.production` (not a secret).
- **Branding** is a global singleton (`convex/branding.ts` + `src/lib/branding.tsx`), publicly
  readable, admin-writable only. Route `head()` titles are build-time static; `BrandingEffects`
  rewrites `document.title` at runtime. Keep both `DEFAULT_BRANDING` copies in sync.
- **Roles**: first account on a deployment becomes `admin`, the rest `user`. Admins only get the
  Branding tab; the server enforces it via `requireAdmin` — UI gates are not authorization.
- Operator migrations live in `convex/migration.ts` — promote admins
  (`migration:backfillAdmin`), force one admin (`setAdmin`), rename the default brand
  (`renameDefaultBrand`), delete a draft invoice by number. Run them with `--env-file` for prod.
