# Sankofa Rent

Rent management for small landlords in Ghana — properties, units, tenants, leases, rent
invoicing, payments, receipts, maintenance and announcements, in one place.

Built for a university final-year project at [example — Ghana]. Designed to be demoed:
one seeded admin account, a focused dataset, and a live deployment per environment.

## What's inside

| Area | Status |
|---|---|
| Email + password auth (Convex Auth) | ✅ Working, verified |
| Dashboard (collection rate, occupancy, arrears, 6-month trend) | ✅ Working |
| Properties & units (CRUD, KPIs) | ✅ Working |
| Tenants (assign units, balances) | ✅ Working |
| Leases (create / renew / end; duplicate-safe unit assignment) | ✅ Working |
| Rent invoices (draft → send → paid, duplicate guard) | ✅ Working |
| Payments & receipts (MoMo / Telecel Cash / AirtelTigo / bank / cash) | ✅ Working |
| Maintenance requests (priority, status tracking) | ✅ Working |
| Announcements (SMS / email / WhatsApp channels) | ✅ Working |
| **Custom branding** — app name, tagline, logo, accent color, live everywhere (header, auth pages, tab title, favicon, theme) | ✅ Working, admin-only |
| Roles (`admin` / `member`) — first account becomes admin | ✅ Working |

## Tech stack

- **Frontend** — React 19, TanStack Start (SSR) + Router + React Query, Tailwind CSS v4
- **Backend** — Convex (schema, indexes, queries, mutations, cron jobs, file storage)
- **Auth** — `@convex-dev/auth` 0.0.98, email + password only
- **Language** — TypeScript strict
- **Tests** — Vitest + Testing Library (unit), manual browser E2E (see `docs/CONVEX_MIGRATION.md`)

## Quick start

Prerequisites: **Node.js ≥ 22 and npm** (no bun, no pnpm, no yarn — the repo pins npm).

```sh
npm install
npx convex dev          # pushes schema/functions to your dev deployment, regenerates types
npm run dev             # http://localhost:8081
```

`.env.local` (gitignored) must define:

```
CONVEX_DEPLOYMENT=dev:<name>|<deploy-key>
VITE_CONVEX_URL=https://<name>.convex.cloud
```

Sign up in the app — the **first account created on a deployment becomes its admin** and
may edit branding. Every later account is a member.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (SSR) |
| `npx convex dev` | Sync backend to the dev deployment + regenerate `convex/_generated/` |
| `npx convex deploy --env-file .env.production.local` | Deploy backend to production |
| `npm test` | Unit tests (vitest) |
| `npm run lint` | ESLint (0 errors; a few acceptable `react-refresh` warnings) |
| `npm run build` | Production build → `.output/` (Nitro `cloudflare-module`) |
| `npx tsc --noEmit` | Typecheck |

## Deploying

Backend and frontend sync through environment files, never through the repo:

| File | Purpose | Committed? |
|---|---|---|
| `.env.local` | **dev** deployment (`dev:…`) | ❌ gitignored |
| `.env.production.local` | **prod** deployment + keys (`prod:…`) | ❌ gitignored |

```sh
npx convex deploy --env-file .env.production.local   # schema + functions to prod
```

Then build and host the frontend (Cloudflare Workers preset). The hosting environment
must define `VITE_CONVEX_URL=https://<prod>.convex.cloud`. See `wrangler.jsonc`.

`docs/CONVEX_MIGRATION.md` has the full deployment table, acceptance checklist and
operator notes (migrations, backfills, deploy keys).

## Roles & security model

- All app data is scoped per landlord; `landlordId` is always derived from the signed-in
  user, never from client input.
- `branding` (name/logo/colors) is a single global row, **publicly readable** (the login
  page needs it) and **writable by admins only** — enforced server-side in `convex/branding.ts`
  (`requireAdmin`), and hidden in the UI for members.
- Money is integer pesewas; dates are epoch ms.
- No secrets in the repo. Deploy keys live only in the gitignored env files above.

## Operator commands

Run with `npx convex run <file:function>` (add `--env-file .env.production.local` for prod):

| Command | Purpose |
|---|---|
| `migration:backfillAdmin` | Promote earliest profile to admin if none exists (safe to re-run) |
| `migration:setAdmin` | Force-set one admin by email (demotes other admins) |
| `migration:renameDefaultBrand` | One-time rename of the default brand (only untouched rows) |
| `migration:deleteDraftInvoiceByNumber` | Delete a DRAFT invoice (e.g. accidental duplicate) |

## Project structure

```
convex/            schema + functions (one file per domain), _generated/
src/components/    app shell (Card/Button/Badge), auth layout, dialogs, design system
src/lib/           branding provider, convex client, formatting utils, tests
src/routes/        TanStack file-routes (/, /properties, /tenants, /leases,
                   /invoices, /payments, /maintenance, /announcements, /settings, /login, …)
docs/              design notes, migration/deployment runbook
```

## License & acknowledgments

University final-year project. Not licensed for redistribution; brand assets are the
owner's. Supersedes the initial Lovable-generated template (retained historical history per
`AGENTS.md`).
