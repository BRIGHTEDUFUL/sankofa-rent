<div align="center">

# ☀ Sankofa Rent

### Rent, handled beautifully.
### Made for Ghanaian landlords.

Property management, rent invoicing, payments and receipts — one calm dashboard.<br/>
Built as a university final-year project, engineered like a product launch.

<a href="https://final-year-rent-project.edimamfaidol.workers.dev"><img src="https://img.shields.io/badge/Live%20App-Open%20%E2%86%92-4E735A?style=for-the-badge" alt="Live App"/></a>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=111111)](https://react.dev/)
[![TanStack](https://img.shields.io/badge/TanStack_Start-1.168-EF552E?style=flat&logo=react&logoColor=white)](https://tanstack.com/start)
[![Convex](https://img.shields.io/badge/Convex-Backend-E5511C?style=flat&logo=convex&logoColor=white)](https://convex.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Deploy](https://img.shields.io/badge/Deploy-Cloudflare_Workers-F38020?style=flat&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

</div>

<br/>

<div align="center">

<img src="docs/assets/dashboard.jpeg" alt="Sankofa Rent — live dashboard" width="100%" />

</div>

---

## Why Sankofa Rent

Rent collection in Ghana still runs through WhatsApp groups, exercise books and scattered MoMo receipts. Property managers can't see their occupancy, lagging tenants or monthly collection at a glance — and owners need proof of payment, not screenshots.

Sankofa Rent gives a single landlord everything: **properties and units, tenants and leases, rent invoices with due dates, in-app payments (MoMo + bank + cash), digital receipts, maintenance requests, announcements and a monthly dashboard** — in English, with pesewas-exact money handling, styled for the Ghanaian market.

And because it's a final-year defense piece, the whole product is **rebrandable live** — name, tagline, logo and accent colour — all changeable from Settings by the admin in front of the panel.

## Features

| | |
|---|---|
| **Dashboard** | Collected vs invoiced, collection rate, occupancy, arrears — last 6 months |
| **Properties & units** | One-tap property + unit management, rent roll, occupancy KPIs |
| **Tenants** | Profiles, unit assignment, balances derived from unpaid invoices |
| **Leases** | Create / renew / end; duplicate-safe unit assignment |
| **Invoices** | Draft → send → paid; monthly generation cron; duplicate guard |
| **Payments & receipts** | MoMo (MTN, Telecel, AirtelTigo), bank, cash — numbered receipts |
| **Maintenance** | Priority + status tracking per unit |
| **Announcements** | SMS / email / WhatsApp channel selection |
| **Branding** | Admin-only: live app name, tagline, 8 curated accent palettes + custom colour, logo upload to Convex storage |
| **Roles** | First account on a deployment becomes admin, the rest members |

## Screenshots

<div align="center">

**Sign in** — custom courtyard imagery, split-screen
<img src="docs/assets/login.jpeg" alt="Sankofa Rent — sign in" width="100%" />

**Live rebranding** — Settings → Branding (admin-only)
<img src="docs/assets/branding.jpeg" alt="Sankofa Rent — Settings → Branding" width="100%" />

</div>

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **TanStack Start** (SSR React 19, file-based routes) + TanStack Query |
| Backend | **Convex** — schema, queries, mutations, crons (overdue invoices, monthly billing, lease expiry), file storage |
| Auth | **@convex-dev/auth 0.0.98** — email + password |
| Styling | Tailwind CSS v4, Plus Jakarta Sans, Sun brand mark |
| Money | Integer pesewas (GH₵ 1 = 100) — never floats |
| Deploy | Cloudflare **Workers** (Nitro `cloudflare-module`), CI as npm-only |
| Tests | Vitest + Testing Library — 14 unit tests |

## Quick start

Prerequisites: **Node.js ≥ 22** and **npm** (no bun/pnpm/yarn).

```sh
npm install
npx convex dev     # syncs backend to your dev deployment
npm run dev        # → http://localhost:8081
```

Create your first account — the first sign-up on a fresh deployment becomes the admin.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (SSR) |
| `npx convex dev` | Push schema/functions to dev, regenerate types |
| `npx convex deploy --env-file .env.production.local` | Push backend to prod |
| `npm test` | Vitest (14 tests) |
| `npm run lint` | ESLint — 0 errors |
| `npm run build` | Production build → `.output/` (Nitro) |
| `npx tsc --noEmit` | Typecheck |

## Deployments

| Environment | URL | Convex deployment |
|---|---|---|
| **Production** | **https://final-year-rent-project.edimamfaidol.workers.dev** | `prod:usable-penguin-827` |
| Development | localhost:8081 | `dev:adorable-pig-437` |

Backend and frontend deploy separately — the frontend is auto-deployed to Cloudflare Workers on every push to `main` (Workers Builds), while the backend goes live on demand with `npx convex deploy --env-file .env.production.local`.

The production backend is pre-seeded with a small, real dataset (1 property · 2 units · 1 tenant · 1 paid invoice · 1 receipt · 1 maintenance request · 1 announcement) — exactly what you see in the screenshots.

## Project structure

```
convex/            # Backend: schema, auth, functions, crons, operator migrations
  schema.ts        # 11 tables; money as pesewas; auth+roles
  branding.ts      # Global brand singleton (public read, admin write)
  migration.ts     # backfillAdmin · setAdmin · renameDefaultBrand · deleteDraftInvoiceByNumber · adoptLandlordData
src/
  components/      # AppShell (Card/Button/Badge), AuthLayout, data pages, design system
  lib/             # BrandingProvider + BrandingEffects, convex client, format utilities
  routes/          # TanStack file-routes: /, /properties, /tenants, /leases, /invoices,
                   # /payments, /maintenance, /announcements, /settings, /login, /signup
docs/              # Assets (screenshots), CONVEX_MIGRATION.md (full runbook)
```

## Engineering highlights

- **Full-stack branding, done properly** — a public singleton table drives a `BrandingProvider`; the React tree, `document.title`, the favicon `link` and the `--primary` CSS variable all re-skin live, with a MutationObserver that guarantees no title-rewrite loop.
- **Server-enforced roles** — UI hides `Settings → Branding` for members, but the write path throws `Admin access required` server-side. UI gates are never authorization.
- **Pesewas-safe money, friendly errors** — `GH₵ 1,850.00` renders correctly; a Convex `Uncaught Error` becomes "Invoice INV-1001 already covers this lease and period".
- **Sign-out is bulletproof** — a hard reload recreates the module-level Convex client instead of leaving stale websocket state behind.
- **14/14 unit tests** on branding validation, the cedi parser and auth rules; zero console errors in production.

## Docs & report

- **[Final-Year Project Report](docs/FINAL_YEAR_PROJECT.md)** — full write-up: objectives, scope, functional/non-functional requirements, architecture, data model, implementation, test evidence, deployment, limitations.
- **[Convex migration runbook](docs/CONVEX_MIGRATION.md)** — schema walk-through, auth wiring, deployment pipelines, operator commands.
- **[Backend map](convex/README.md)** — one function file per domain.

## Roadmap

- [x] Live on Cloudflare Workers (`final-year-rent-project`)
- [x] Custom branding (name · tagline · logo · accent) with admin audit
- [x] Roles (admin / member), first-account-becomes-admin
- [ ] Password-reset emails (Resend)
- [ ] SMS / WhatsApp rent reminders (Arkesel/mNotify)
- [ ] MoMo collection webhooks (MTN/Telecel/AirtelTigo)

## License

University final-year project · Sankofa Rent · 2026. Brand assets belong to the author.
