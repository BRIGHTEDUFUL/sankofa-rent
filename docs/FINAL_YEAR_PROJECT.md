# Sankofa Rent — Final-Year Project Report

### "Rent, handled beautifully." A full-stack rent-management platform for Ghanaian landlords

**Author:** Edith Nonnon
**Programme:** Final-Year Project · 2026
**Supervisor:** __________________________ _(complete before submission)_
**Live system:** https://final-year-rent-project.edimamfaidol.workers.dev
**Source code:** https://github.com/BRIGHTEDUFUL/sankofa-rent

> This report documents the finished, deployed system — every claim in it can be
> verified by opening the links above or by reading the repository.

---

## Table of contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Related systems](#3-related-systems)
4. [Methodology](#4-methodology)
5. [System requirements](#5-system-requirements)
6. [System design](#6-system-design)
7. [Implementation](#7-implementation)
8. [Testing and evaluation](#8-testing-and-evaluation)
9. [Deployment and operations](#9-deployment-and-operations)
10. [Limitations and future work](#10-limitations-and-future-work)
11. [Conclusion](#11-conclusion)
12. [References](#12-references)
13. [Appendix A — Screenshots](#13-appendix-a--screenshots)
14. [Appendix B — Project structure](#14-appendix-b--project-structure)
15. [Appendix C — Route map](#15-appendix-c--route-map)
16. [Appendix D — Backend function inventory](#16-appendix-d--backend-function-inventory)
17. [Appendix E — Test evidence](#17-appendix-e--test-evidence)
18. [Appendix F — Deployed environment](#18-appendix-f--deployed-environment)

---

## 1. Abstract

Sankofa Rent is a production-deployed, full-stack web application that centralises rent management for small landlords in Ghana. Landlords manage properties and units, register tenants, draw up leases, issue rent invoices, record payments and issue digital receipts, triage maintenance requests, and broadcast announcements — all from one interface. The system ships with authenticated accounts, role-based administration, live rebranding (name, tagline, logo and accent colour), a six-month financial dashboard, a fully native-feel mobile experience (iOS translucency, Android Material 3 ripple, bottom tab bar, page transitions), and a coherent visual design system free of common AI-generated UI anti-patterns. It is built on TanStack Start (SSR React), Tailwind CSS v4, Framer Motion, and the Convex backend, deployed on Cloudflare Workers with a managed Convex cloud database, and accessed at a public URL on the open internet. It was developed, tested end to end (49 checks), mobile-audited and shipped in November 2026 as a university final-year project.

---

## 2. Introduction

### 2.1 Background and motivation

Small and mid-size landlords in Ghana manage their portfolios largely by hand: paper exercise books for tenants and amounts, WhatsApp groups for notices, loose MoMo receipts for proof of payment, and memory for what is due when. Problems compound quietly — a tenant pays without evidence, an invoice goes unnoticed until the arrears are large, a maintenance item is forgotten, or a property changes hands and the records do not survive the handover.

The name **Sankofa** is drawn from the Akan Adinkra symbol _san ko fa_ — "go back and fetch it" — an image of learning from the past. The name doubles as the product's promise: landlords can always go back and fetch an invoice, a receipt, a lease, a payment.

### 2.2 Problem statement

There is no affordable, well-designed, single-source-of-truth rent-management system shaped around a Ghanaian small landlord's reality: GHS currency, mobile-money payments, Adinkra identity, local tenancy norms (advance months, GHS deposits, estate company rules), and intermittent connectivity. The closest tools are either generic accounting software (too heavy), WhatsApp (too ephemeral), or a spreadsheet (too fragile).

### 2.3 Objectives

**General objective.** Design, build, deploy and document a complete web platform that lets a Ghanaian landlord run their rental business end to end from one place.

**Specific objectives.**

| #   | Objective                                               | Delivered                                                                 |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Account system with secure sign-in and sign-out         | Email + password (Convex Auth)                                            |
| 2   | First account becomes admin; later accounts are members | Verified on both deployments                                              |
| 3   | Manage properties, units, tenants                       | CRUD with occupancy & rent-roll KPIs                                      |
| 4   | Leases with create/renew/end; safe unit assignment      | End-to-end browser-verified                                               |
| 5   | Invoice generation, sending, paid receipts              | Draft → send → paid/part-paid, duplicate guard                            |
| 6   | Payment recording with receipt numbers                  | `RCP-####` numbering from a counter                                       |
| 7   | Announcements broadcast to tenants                      | SMS/Email/WhatsApp channel selection                                      |
| 8   | Dashboard with collection, occupancy, arrears           | Live KPIs + 6-month bar chart                                             |
| 9   | Admin-only live rebranding of the entire app            | Name, tagline, logo, accent colour, favicon, title                        |
| 10  | Production deployment with real data                    | Live on Cloudflare Workers + Convex                                       |
| 11  | Full mobile-native experience                           | Bottom tab bar, iOS blur, Android M3 ripple, page transitions             |
| 12  | Coherent visual design system                           | No banned anti-patterns; browser surfaces themed; accessible error states |
| 13  | Test, audit, and document the system                    | 14/14 unit tests; 49 browser checks; impeccable detector: 0 findings      |

### 2.4 Scope and delimitations

**In scope:**

- Web app (desktop & mobile) for a single landlord per account
- Property / unit / tenant / lease / invoice / payment / maintenance / announcement CRUD
- A financial dashboard with 6-month trend
- Custom branding and role-based access control
- Full mobile-native experience: platform detection, iOS translucency, Android Material 3, Framer Motion page transitions, keyboard-offset handling
- Production deployment to a public URL, backend in the managed Convex cloud

**Explicitly out of scope (documented as future work):**

- Third-party outbound SMS / WhatsApp gateway subscriptions (Arkesel/mNotify) — replaced with a 100% self-contained in-app Tenant Notice Board (`/notices`)
- Mobile-money collection webhooks (MTN/Telecel/AT) — records can be entered with a MoMo reference, money does not flow through the app
- Third-party email SMTP service — replaced with a self-contained admin-managed password reset and forced reset verification workflow
- Multi-landlord SaaS onboarding, billing plans, and team accounts
- Native iOS/Android apps — the web app is fully responsive with a native-feel bottom nav

### 2.5 Significance

- **For landlords:** a single, honest view of occupancy, arrears and cash collected; instant receipts for tenants; evidence for deposit/dispute cases; a beautiful native experience on the phones they already carry.
- **For tenants:** a receipt for every MoMo payment; advance notice of rent due day and maintenance work.
- **For the department:** a deployed, verifiable artefact (not a slide deck) — code, tests, live system, and this document.

### 2.6 Definition of terms

| Term                            | Meaning                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| Pesewa                          | 1/100 of a Ghana cedi (GH₵). Money is stored as integer pesewas                              |
| Occupancy                       | % of non-vacant units (occupied ÷ total units)                                               |
| Collection rate                 | paid ÷ invoiced (this month), as a percentage                                                |
| Arrears                         | sum of unpaid-overdue invoice balances                                                       |
| Advance rent                    | months of rent paid ahead of the tenancy start                                               |
| Invoice number / receipt number | sequential identifiers, e.g. `INV-1001`, `RCP-1001`                                          |
| Singleton                       | one table holding exactly one row (`branding`)                                               |
| Admin / member                  | the two roles; first account becomes admin                                                   |
| Convex                          | managed backend platform: database, functions, crons, file storage, auth                     |
| Workers                         | Cloudflare's serverless edge runtime hosting the SSR frontend                                |
| dvh                             | dynamic viewport height — `100dvh` accounts for mobile browser chrome appearing/disappearing |
| Safe-area insets                | iOS/Android padding for notch, home indicator, and status bar                                |
| M3                              | Material Design 3, Google's design language for Android                                      |

---

## 3. Related systems

### 3.1 Common adoption pattern

Most small landlords in Accra, Kumasi and Cape Coast use some combination of:

- **Exercise books / paper ledgers** — durable but illegible at a glance, impossible to search, lost on handover.
- **WhatsApp groups** — free, fast, and already in use, but messages are not durable records and receipts are scattered.
- **Excel / Google Sheets** — structurally capable but formula-fragile, no mobile-friendly worldview, no or weak audit trail.
- **Accounting software (QuickBooks, Sage, Zoho Books)** — powerful general-purpose accounting, but designed for Western pipelines, USD/EUR accounting, and credit-card reconciliation. MoMo references as first-class citizens don't exist.
- **Generic property managers (Buildium, AppFolio, Rentec Direct)** — US/UK-centric: lease portals, HOAs, QuickBooks integrations; priced for large multi-unit portfolios, not a single landlord in Ghana.

### 3.2 Lessons drawn from the gap

1. **Local money and identity first** — Ghana cedi with integer pesewas, MoMo references, GHS-first UI, `₵` not `$`.
2. **Mobile is the primary device** — Ghanaian landlords manage their portfolios from phones. A desktop-only tool is a tool they won't use; a bottom nav and 44 px+ touch targets are not optional.
3. **First-run experience must be zero-config** — a new landlord signs up and sees an empty-but-shaped dashboard immediately (one property away from being useful).
4. **Brand as a first-class feature** — a white-label product lets this app survive contact with real estate agents; rebranding the whole app from inside is the killer demo feature and genuinely useful.
5. **Honest engineering** — no fake buttons, no pretend "send" actions, no mock success messages. Every action that doesn't work yet says so, in the UI.

---

## 4. Methodology

### 4.1 Approach

An **iterative, build-verify loop**: each feature was specified, implemented, browser-tested as a real user, and only then pushed onward. Nothing is shipped as "should work". Every UI action in this report was performed against the deployed application. The mobile experience was verified with device-emulated viewports and touch synthesis; the visual design system was mechanically checked with an automated detector (0 findings at time of submission).

### 4.2 Technology choices

| Layer       | Choice                                         | Why                                                                               |
| ----------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Language    | TypeScript 5.8 (strict)                        | type-safe API from client to database                                             |
| Framework   | TanStack Start 1.168 (SSR, file routes)        | modern SSR, type-safe routing, fast nitro builds                                  |
| React       | React 19                                       | ecosystem compatibility, concurrent features                                      |
| State/query | TanStack React Query 5                         | caching, loading states, background refetch                                       |
| Backend     | Convex 1.50                                    | integrated DB + functions + crons + storage + auth; no separate server to operate |
| Auth        | @convex-dev/auth 0.0.98                        | email+password, JWTs, deployed to the same backend                                |
| Styling     | Tailwind CSS v4                                | token-driven, `@utility` custom utilities, mobile-first                           |
| Animation   | Framer Motion 14                               | page transitions, Android M3 pill indicator, More drawer                          |
| Charts      | Recharts 2                                     | dashboard trend and collection gauge                                              |
| Testing     | Vitest 4 + Testing Library                     | fast unit tests, zero-network                                                     |
| Bundler     | Vite 8 / nitro 3                               | fast dev loop, Cloudflare-compatible output                                       |
| Deploy      | Cloudflare Workers (nitro `cloudflare-module`) | global edge, free tier, one-command deploys                                       |

### 4.3 Requirements elicitation

Features were taken from real rental life, anchored in a single seeded demo case: a landlord with **Adenta Court**, units **A1 (2-bed, GH₵ 1,850) and A2 (1-bed, GH₵ 1,250)**, tenant **Kwame Asante**, a lease to Dec 2027 with one month advance, one November invoice for GH₵ 1,850 **paid via MTN MoMo**, one maintenance report (a leaking tap), and one tenant announcement. Every feature in §5.1 maps to an action performed on this seed case.

### 4.4 Repository hygiene

- npm-only (`bun.lock`/`bunfig.toml` removed after a stale bun lockfile broke CI)
- `package-lock.json` is the source of truth; `npm ci` reproduces the tree exactly
- Prettier + ESLint + `tsc --noEmit` gate every change; `.output/` and `.env.local` are gitignored
- Commits are small, signed by intent, and each one keeps the deployed site working

---

## 5. System requirements

### 5.1 Functional requirements

**Authentication & accounts**

| ID    | Requirement                                                                     | Status |
| ----- | ------------------------------------------------------------------------------- | ------ |
| FR-A1 | Sign up with email + password; form validates before submit                     | ✅     |
| FR-A2 | Sign in; failed attempts show a friendly error                                  | ✅     |
| FR-A3 | Sign out; session cleared; full reload recreates the client                     | ✅     |
| FR-A4 | Redirect to `/login` when unauthenticated; redirect `/` → `/login` both ways    | ✅     |
| FR-A5 | First account on a deployment becomes `admin`; subsequent accounts are `member` | ✅     |
| FR-A6 | Forgot-password allows requesting admin reset; admin sets temporary password    | ✅     |

**Dashboard (`/`)**

| ID    | Requirement                                                             | Status |
| ----- | ----------------------------------------------------------------------- | ------ |
| FR-D1 | Show collected this month, occupancy %, arrears, expected this month    | ✅     |
| FR-D2 | 6-month bar chart: invoiced vs collected                                | ✅     |
| FR-D3 | Collection-rate gauge for the current month                             | ✅     |
| FR-D4 | Recent payments (latest first)                                          | ✅     |
| FR-D5 | Open maintenance requests list                                          | ✅     |
| FR-D6 | Tenant announcements feed                                               | ✅     |
| FR-D7 | Quick actions: "Set up MoMo", "Add property", "Record payment"          | ✅     |
| FR-D8 | Landlord identity card: name, business, properties/units/tenants counts | ✅     |
| FR-D9 | Mobile greeting hero with avatar initials (hidden on desktop)           | ✅     |

**Properties & units (`/properties`)**

| ID    | Requirement                                                     | Status |
| ----- | --------------------------------------------------------------- | ------ |
| FR-P1 | Create/edit/delete property (name, area, region, GhanaPost GPS) | ✅     |
| FR-P2 | Add/edit units (label, bedrooms, rent)                          | ✅     |
| FR-P3 | Occupancy KPIs per property and portfolio-wide                  | ✅     |
| FR-P4 | Total rent roll per property                                    | ✅     |
| FR-P5 | Unit status: vacant / occupied / maintenance                    | ✅     |

**Tenants (`/tenants`)**

| ID    | Requirement                                | Status |
| ----- | ------------------------------------------ | ------ |
| FR-T1 | Register tenant with name, phone, email    | ✅     |
| FR-T2 | Optionally assign to a vacant unit         | ✅     |
| FR-T3 | Balance derived from unpaid invoices       | ✅     |
| FR-T4 | Archive without deleting financial history | ✅     |

**Leases (`/leases`)**

| ID    | Requirement                                                               | Status |
| ----- | ------------------------------------------------------------------------- | ------ |
| FR-L1 | Create lease: tenant + unit, start/end, rent, advance months, deposit     | ✅     |
| FR-L2 | Unit is offered only if vacant or already assigned to the same tenant     | ✅     |
| FR-L3 | Renew a lease — new end date must be strictly later than current          | ✅     |
| FR-L4 | End a lease — unit goes back to `vacant`                                  | ✅     |
| FR-L5 | End date after start date; positive pesewas rent; safe-integer validation | ✅     |

**Rent invoices (`/invoices`)**

| ID    | Requirement                                                                | Status |
| ----- | -------------------------------------------------------------------------- | ------ |
| FR-I1 | Create a draft invoice for a lease and period                              | ✅     |
| FR-I2 | Send: `draft → sent`                                                       | ✅     |
| FR-I3 | Prevent duplicate invoice for the same lease + period                      | ✅     |
| FR-I4 | Cron `generateMonthly` creates draft invoices for active leases each month | ✅     |
| FR-I5 | Cron `markOverdue` flips past-due `sent`/`partial` to `overdue`            | ✅     |
| FR-I6 | Cron `flagExpiring` flags leases ending within 60 days                     | ✅     |

**Payments & receipts (`/payments`)**

| ID    | Requirement                                                                       | Status |
| ----- | --------------------------------------------------------------------------------- | ------ |
| FR-Y1 | Record payment: tenant, optional invoice, amount, method, reference               | ✅     |
| FR-Y2 | MoMo names: MTN, Telecel, AirtelTigo                                              | ✅     |
| FR-Y3 | Methods: MTN MoMo, Telecel Cash, AirtelTigo Money, bank, cash                     | ✅     |
| FR-Y4 | Payment increases `invoice.paid`; sets `partial` or `paid`; `overdue` if past due | ✅     |
| FR-Y5 | Payment rejected if it exceeds the invoice balance                                | ✅     |
| FR-Y6 | Receipt number issued: `RCP-1001`…                                                | ✅     |
| FR-Y7 | Listing shows lifetime received + this month                                      | ✅     |

**Maintenance (`/maintenance`)**

| ID    | Requirement                                                               | Status |
| ----- | ------------------------------------------------------------------------- | ------ |
| FR-M1 | Open a request: title, description, property, unit, priority, reported by | ✅     |
| FR-M2 | Priority: low / medium / high                                             | ✅     |
| FR-M3 | Status workflow: open → in progress → resolved                            | ✅     |
| FR-M4 | Unit is auto-disabled for whole-property requests                         | ✅     |

**Announcements & Tenant Notices (`/announcements` & `/notices`)**

| ID    | Requirement                                                                            | Status |
| ----- | -------------------------------------------------------------------------------------- | ------ |
| FR-N1 | Compose announcement with title, body, target audience (all or specific property)      | ✅     |
| FR-N2 | Self-contained in-app delivery: publishes directly to Tenant Notice Board (`/notices`) | ✅     |
| FR-N3 | Pin/unpin; urgent notice highlighting; delete                                          | ✅     |
| FR-N4 | One-click copy notice board link & view live tenant notice board without external APIs | ✅     |

**Settings (`/settings`) — seven tabs**

| ID    | Requirement                                                                                                                                                 | Status |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-S1 | Profile: avatar initials, first/last name, phone                                                                                                            | ✅     |
| FR-S2 | Business: name, region, currency (GHS read-only), rent due day (1–31), late fee %                                                                           | ✅     |
| FR-S3 | **Accounts (admin-only):** multi-admin management, promote/demote roles, password resets, account creation and deletion                                     | ✅     |
| FR-S4 | **Branding (admin-only):** live rename of app, tagline, accent colour (8 curated swatches + custom, 4.5:1 contrast enforced), logo upload to Convex storage | ✅     |
| FR-S5 | Notifications: in-app notice board integration; zero external SMS/WhatsApp/email dependencies                                                               | ✅     |
| FR-S6 | Payment methods: MoMo number + network, bank name + account                                                                                                 | ✅     |
| FR-S7 | Security: role badge, plan, currency, self-contained admin-managed password reset workflow                                                                  | ✅     |

**Mobile experience**

| ID     | Requirement                                                                                            | Status |
| ------ | ------------------------------------------------------------------------------------------------------ | ------ |
| FR-X4  | Mobile bottom tab bar (Home, Properties, Tenants, Payments + More drawer) with safe-area padding       | ✅     |
| FR-X5  | Fixed mobile top bar with back/logo/bell/avatar; iOS: centred title; Android: left-aligned             | ✅     |
| FR-X6  | iOS translucent tab bar (backdrop-filter blur/saturate)                                                | ✅     |
| FR-X7  | Android Material 3 animated pill indicator (Framer Motion `layoutId`)                                  | ✅     |
| FR-X8  | Page transition animations (Framer Motion `AnimatePresence`)                                           | ✅     |
| FR-X9  | Platform detection hook (`usePlatform`) stamps `data-platform` on `<html>`                             | ✅     |
| FR-X10 | Android haptic feedback via `navigator.vibrate`                                                        | ✅     |
| FR-X11 | Android Material 3 ripple on tab bar items                                                             | ✅     |
| FR-X12 | iOS input zoom prevention (`md:text-sm` removed from Input component)                                  | ✅     |
| FR-X13 | Form grids collapse to single-column on mobile (`grid-cols-1 sm:grid-cols-2`)                          | ✅     |
| FR-X14 | Keyboard offset via `window.visualViewport` so forms are not obscured                                  | ✅     |
| FR-X15 | Scrollable chip tab strip in Settings on mobile                                                        | ✅     |
| FR-X16 | Sticky save-bar above safe-area inset on mobile settings forms                                         | ✅     |
| FR-X17 | Dark mode token set for both OS preference and manual toggle                                           | ✅     |
| FR-X18 | Dual `theme-color` meta (light/dark `prefers-color-scheme`)                                            | ✅     |
| FR-X19 | Standardized 44 px touch targets for selects & inputs (`SelectTrigger` + `Input` height `h-11 sm:h-9`) | ✅     |
| FR-X20 | Accessible label-control associations & touch micro-interactions (`pressable`) across all data actions | ✅     |

**Cross-cutting**

| ID     | Requirement                                                                          | Status |
| ------ | ------------------------------------------------------------------------------------ | ------ |
| FR-XC1 | Every query/mutation derives the landlord from the session — never from client input | ✅     |
| FR-XC2 | Settings errors and validation messages as pill banners (not border-left lines)      | ✅     |
| FR-XC3 | Empty states on every screen with icon + heading + hint (no dead ends)               | ✅     |
| FR-XC4 | 404 and error pages use `min-h-dvh` and contextual icons                             | ✅     |
| FR-XC5 | Browser surfaces themed: `caret-color`, `::selection`, custom scrollbars             | ✅     |
| FR-XC6 | Staggered list entrance animation via `stagger-children` utility                     | ✅     |

### 5.2 Non-functional requirements

| ID    | Requirement              | How it's met                                                                                                                         |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| NF-1  | **Correctness of money** | integer pesewas everywhere; display via `format.ts` only                                                                             |
| NF-2  | **Data integrity**       | ownership checks on every patch/delete; no cross-landlord reads possible                                                             |
| NF-3  | **Performance**          | server-side aggregation for dashboards; skeleton loading states; `isMobile` XAxis interval reduction                                 |
| NF-4  | **Availability**         | Convex managed DB (multi-region reads), Cloudflare edge SSR                                                                          |
| NF-5  | **Security**             | password hashing by Convex Auth; JWT sessions server-side; `.env.*.local` gitignored; deploy keys never committed                    |
| NF-6  | **Reliability**          | sign-out triggers full page reload (module-level Convex client recreated)                                                            |
| NF-7  | **Usability**            | 44 px+ touch targets; `clamp()` font sizes; `tabular-nums` on all money; no horizontal overflow on 320 px                            |
| NF-8  | **Portability**          | npm-only pins; Node ≥ 22; no bun requirement                                                                                         |
| NF-9  | **Maintainability**      | TypeScript strict mode (0 errors), ESLint 0 errors, Prettier; design detector: 0 findings                                            |
| NF-10 | **Accessibility**        | contrast-enforced accent swatches; `aria-current="page"` on nav; `aria-label` on icon buttons; `role="alert"` on error banners       |
| NF-11 | **Responsiveness**       | `dvh` for full-height layouts; `overflow-x: hidden` on html/body; global `box-sizing: border-box`; `overflow-wrap: anywhere` on body |

### 5.3 User roles and permissions

| Capability                                                                                                                     | Member                      | Admin |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | ----- |
| Sign in / out                                                                                                                  | ✅                          | ✅    |
| Own properties/units/tenants/leases/invoices/payments/maintenance/announcements/profile/business/payment-methods/notifications | ✅                          | ✅    |
| **Settings → Branding** (rename app, recolour, upload logo)                                                                    | ❌ hidden & server-rejected | ✅    |
| Role badge                                                                                                                     | Member                      | Admin |
| First account on a deployment                                                                                                  | becomes Admin               | —     |

---

## 6. System design

### 6.1 High-level architecture

```
┌────────────────────────────────────────────────────────────┐
│  Browser (React 19 + TanStack Router/Start SSR)            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  __root shell → ClientOnly (hydration guard)        │   │
│  │  ConvexProviders → BrandingProvider → BrandingEffects│  │
│  │  AppShell                                           │   │
│  │   ├─ MobileTopBar (< sm, fixed, blur, back/logo)    │   │
│  │   ├─ Desktop header (≥ sm, sticky, greeting)        │   │
│  │   ├─ Desktop sidebar (≥ sm, pill, icon nav)         │   │
│  │   ├─ <main> AnimatePresence page transitions        │   │
│  │   └─ BottomTabBar (< sm, fixed, M3 + iOS styles)    │   │
│  └─────────────────────────────────────────────────────┘   │
│  usePlatform → data-platform on <html> (ios/android/other) │
│  Convex client (useQuery / useMutation over wss)           │
└──────────────────────┬─────────────────────────────────────┘
                       │ wss + https
┌──────────────────────▼─────────────────────────────────────┐
│  Cloudflare Workers (SSR, nitro cloudflare-module)         │
│  production: final-year-rent-project.edimamfaidol.workers.dev
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│  Convex cloud — deployment usable-penguin-827 (prod)       │
│  ┌──────────┐ ┌─────────┐ ┌────────┐ ┌──────┐ ┌─────────┐ │
│  │ database │ │ indexes │ │ crons  │ │ auth │ │ storage │ │
│  │ 11 tables│ │ 22 idx  │ │ 3 jobs │ │ JWT  │ │ logo/…  │ │
│  └──────────┘ └─────────┘ └────────┘ └──────┘ └─────────┘ │
│  query/mutation functions (TypeScript)                      │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Data model

| Table           | Purpose                                                  | Key indexes                             |
| --------------- | -------------------------------------------------------- | --------------------------------------- |
| `users` (auth)  | Convex-managed accounts                                  | `email`                                 |
| `profiles`      | 1:1 with users — identity, business, MoMo, plan, role    | `by_user`                               |
| `branding`      | singleton — app name/tagline/accent/logo                 | —                                       |
| `properties`    | name / area / region / GPS / photo                       | `by_landlord`                           |
| `units`         | label / bedrooms / rent (pesewas) / status               | `by_landlord`, `by_property`            |
| `tenants`       | name / phone / email / ghanaCard / rent-since / archived | `by_landlord`, `by_unit`                |
| `leases`        | tenant+unit, start/end, rent, advance, deposit, status   | `by_landlord`, `by_tenant`, `by_end`    |
| `invoices`      | number, period, dueDate, amount, paid, status            | `by_landlord`, `by_status`, `by_tenant` |
| `payments`      | receiptNo, method, reference, amount, paidAt             | `by_landlord`, `by_tenant`              |
| `maintenance`   | title / priority / status / cost                         | `by_landlord`, `by_status`              |
| `announcements` | title / body / pinned / channels / propertyId?           | `by_landlord`                           |
| `counters`      | invoice/receipt numbering per landlord                   | `by_name`                               |

Money: **integer pesewas** everywhere (`185000` = GH₵ 1,850.00). Dates: epoch milliseconds (`Date.UTC`).

### 6.3 Authentication & authorization design

```
signUp ──▶ afterUserCreatedOrUpdated ──▶ profile row created
              (role=admin if profiles table is empty, else "user")
signIn ──▶ JWT session stored in localStorage; sent on every Convex request
requireUser  ──▶ userId from JWT or throws "Not signed in"
requireAdmin ──▶ profile.role === "admin" or throws "Admin access required"
```

- `profiles.update` allowlists writable fields. `plan` and `currency` are **not** client-writable.
- `branding.update` requires `requireAdmin` server-side, regardless of UI visibility.

### 6.4 Mobile architecture

The mobile experience is split across three layers:

**Platform detection** (`src/hooks/use-platform.ts`) — detects iOS/Android/other from `navigator.userAgent` at mount, caches the result module-level, and stamps `document.documentElement.dataset.platform`. Called in `__root.tsx` for early stamping and again in `AppShell` for rendering decisions.

**CSS layer** (`src/styles.css`) — adds safe-area CSS variables (`--sat`, `--sab`, etc.), a global `box-sizing: border-box` reset, `dvh` / `hide-scrollbar` / `pb-nav` / `sticky-save-bar` / `stagger-children` Tailwind `@utility` declarations, iOS translucency and Android M3 background rules scoped to `[data-platform]`, and a full dark-mode token set.

**Shell layer** (`AppShell.tsx`) — `MobileTopBar` (fixed, `sm:hidden`) handles back navigation, logo, bell and avatar; `BottomTabBar` (fixed, `sm:hidden`) handles the five-slot bottom nav (4 primary + More), the More drawer (Framer Motion spring bottom-sheet), the Android M3 `layoutId` pill, and iOS filled icons. The main content area wraps children in `AnimatePresence` for page transitions. A `visualViewport` listener tracks the soft keyboard offset.

### 6.5 Design system

The visual system is built on OKLCH design tokens in `styles.css` covering light and dark modes. Key decisions:

- **Typography:** Plus Jakarta Sans via Google Fonts; system fonts on mobile (`-apple-system, BlinkMacSystemFont, Roboto, system-ui`); `clamp()` font sizes on KPI numbers to prevent overflow at 320 px.
- **Color:** OKLCH tokens throughout; no hard-coded hex in component code. Dark mode tokens defined in both `@media (prefers-color-scheme: dark)` and `:root.dark` class forms for OS and manual override.
- **Elevation:** single `--shadow-soft` variable; no zero-offset colored halos; no `border-left` accent stripes.
- **States:** error messages rendered as `bg-destructive-soft` pill banners; status messages as `bg-primary-soft` banners. No `border-l-2` colored borders on inline text.
- **Animation:** `animate-rise` at 350 ms cubic-bezier spring; `stagger-children` for list entrance; Framer Motion for interactive transitions. `prefers-reduced-motion` suppresses all three.
- **Browser surfaces:** `caret-color: var(--primary)`; `::selection` tinted from primary; custom scrollbars using `--border` and `--muted-foreground` tokens.

### 6.6 Branding system

The scoring feature for a final-year defence is live rebranding of the entire application by the on-screen admin:

```
BrandingProvider (React context)
 ─▶ useQuery(api.branding.get)           ─▶ {} (public, no auth required)
 ─▶ value = data ?? DEFAULT_BRANDING     ─▶ fallbacks never throw
 ─▶ BrandingEffects (mounted once)
       title   – rewrites document.title on every SPA navigation
       favicon – replaces <link rel="icon"> href with Convex storage URL
       --primary/--ring/--accent/gradient – live CSS variable injection
       MutationObserver on <head>  ─▶ rewrite titles on SPA navigation
                                      (compute-and-compare guard prevents loops)
```

Logo uploads go through `files.generateUploadUrl` (auth-required) → raw POST → `storage.getUrl` → stored `logoId` on the `branding` singleton. Replacing a logo deletes the old storage object.

The two `DEFAULT_BRANDING` copies (server `convex/branding.ts`, client `src/lib/branding.tsx`) are intentionally duplicated — Convex deployments cannot import app code. Each file comments a pointer to the other.

### 6.7 API surface summary

| Module             | Exports                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `profiles.ts`      | `me` · `update`                                                                                          |
| `dashboard.ts`     | `summary` · `monthly`                                                                                    |
| `properties.ts`    | `list` · `create` · `update` · `remove` · `addUnit` · `updateUnit`                                       |
| `tenants.ts`       | `list` · `create` · `update` · `archive`                                                                 |
| `leases.ts`        | `list` · `create` · `renew` · `end` · `flagExpiring` (internal)                                          |
| `invoices.ts`      | `list` · `create` · `send` · `generateMonthly` (internal) · `markOverdue` (internal)                     |
| `payments.ts`      | `list` · `record`                                                                                        |
| `maintenance.ts`   | `list` · `create` · `updateStatus`                                                                       |
| `announcements.ts` | `list` · `create` · `togglePin` · `remove`                                                               |
| `branding.ts`      | `get` · `update` · `DEFAULT_BRANDING`                                                                    |
| `files.ts`         | `generateUploadUrl`                                                                                      |
| `migration.ts`     | `backfillAdmin` · `setAdmin` · `renameDefaultBrand` · `deleteDraftInvoiceByNumber` · `adoptLandlordData` |

### 6.8 Server-side invariants

| Invariant                                        | Enforced in                                         |
| ------------------------------------------------ | --------------------------------------------------- |
| End date after start date                        | `leases.ts`                                         |
| Rent ≥ 1 pesewa                                  | `Number.isSafeInteger` checks in leases & invoices  |
| A unit assigned to a tenant must stay consistent | `leases.create`                                     |
| Cannot invoice a draft or inactive lease         | frontend flow + `invoices.create` guard             |
| Reject duplicate invoice (lease + period)        | `invoices.create` queries by `leaseId+period` first |
| Cannot pay more than invoice outstanding         | `payments.record`                                   |
| Cannot double-assign same unit to two tenants    | `leases.create` + unit dropdown filter              |
| `plan` & `currency` unchangeable by client       | omitted from `profiles.update` allowlist            |
| Admin-only branding                              | `branding.update` → `requireAdmin`                  |

---

## 7. Implementation

### 7.1 Repository map

```
convex/                   # backend — schema, auth, functions, crons, migrations
src/
  routes/                 # TanStack file-routes (/, /login, /signup, …)
  components/
    app/                  # Card, Button, Badge, AppShell, DataPage, FormDialog
    auth/                 # AuthLayout, Field, SubmitButton, AuthNotice
    ui/                   # Radix-based primitives (select, dialog, input, switch …)
  hooks/                  # use-platform.ts, use-ripple.ts, use-mobile.ts
  lib/                    # convex.tsx, branding.tsx, format.ts, haptics.ts, auth-validation.ts
  styles.css              # Tailwind v4 source: tokens, utilities, platform CSS, dark mode
docs/                     # this report + CONVEX_MIGRATION.md + screenshots
public/                   # favicon.svg, manifest.webmanifest, icons, robots.txt
```

### 7.2 Key new files (mobile overhaul, November 2026)

| File                        | Purpose                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `src/hooks/use-platform.ts` | iOS/Android/other detection; stamps `data-platform` on `<html>`; module-level cache      |
| `src/hooks/use-ripple.ts`   | Android Material 3 ripple — injects a DOM `span.ripple-wave` on `mousedown`/`touchstart` |
| `src/lib/haptics.ts`        | Wraps `navigator.vibrate` for Android tap (8 ms) and medium (12-8-12 ms) feedback        |
| `MOBILE_AUDIT.md`           | Phase-0 audit findings that drove the mobile overhaul                                    |

### 7.3 Notable bugs found and fixed

| #   | Defect                                                        | Impact                                          | Fix                                                           |
| --- | ------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| 1   | `Button` in `AppShell` missed `onClick`                       | "New…" actions silently did nothing             | widen `React.ComponentProps<"button">`                        |
| 2   | `Card` required children                                      | 9 skeleton sites failed typecheck               | `children?: ReactNode`                                        |
| 3   | `AppShell` API import path wrong                              | typecheck broken before it ran                  | correct relative path                                         |
| 4   | `profiles.ts` index signature access                          | type error under strict mode                    | use bracket notation                                          |
| 5   | `.prettierrc` `endOfLine: lf` vs CRLF checkout                | 5,380 false-positive lint errors                | `endOfLine: auto`                                             |
| 6   | `document.title.replace` + `MutationObserver` without guards  | infinite mutation loop — tab froze              | compute-and-compare guard + cleanup in effect                 |
| 7   | `pesewasFromCedi("1,600")` → NaN                              | thousands-separated placeholder rejected        | strip commas/whitespace/prefix first                          |
| 8   | `invoices.create` allowed same period twice                   | duplicate INV rows                              | query by `leaseId+period` before insert                       |
| 9   | `leases.create` unit filter ignored assigned state            | lease impossible after tenant created with unit | filter to vacant OR same-tenant units; server-side check      |
| 10  | `signOut` + client-side navigate left Convex client wedged    | sign-out/in cycles froze tab                    | hard `window.location.assign` reload                          |
| 11  | `afterUserCreatedOrUpdated` used anonymous type               | typecheck blocked                               | `.filter()` by field                                          |
| 12  | `exactOptionalPropertyTypes: true` broke optional-args idiom  | 17 call sites failed                            | set `false`, documented                                       |
| 13  | `whitespace-nowrap` on KPI currency amounts                   | horizontal overflow at 320 px                   | removed; replaced with `clamp()` font sizes                   |
| 14  | `grid-cols-2` in Drawer forms at 320 px                       | columns too narrow to read                      | `grid-cols-1 sm:grid-cols-2` on all four form-pair grids      |
| 15  | `md:text-sm` on `Input` component                             | iOS zooms in on focus                           | removed; `text-base` throughout                               |
| 16  | Recharts SVG escaping container on narrow viewports           | chart overflow                                  | `overflow-hidden` wrapper on chart div                        |
| 17  | Decorative hard-coded sparkline bars in KPI card              | banned pattern — data not from real source      | replaced with contextual icon                                 |
| 18  | `border-l-4 border-primary` on payment list items             | banned side-tab accent strip                    | removed; plain row layout                                     |
| 19  | `border-l-2` colored left-border on all error/status messages | banned pattern across 6 files                   | replaced with pill banner using soft-tinted background tokens |
| 20  | Eyebrow kicker above auth page h1 (`text-xs uppercase`)       | banned kicker/eyebrow pattern                   | removed; tagline moved to aside caption                       |

### 7.4 What is intentionally not implemented

- **SMS/Email/WhatsApp delivery** — `channels` is recorded; no provider wired.
- **Automated transactional emails** — Outbound emails require a configured provider (e.g. Resend); password reset is handled via admin-assigned temporary passwords with mandatory first-login password update.
- **MoMo collection** — payments recorded with MoMo references; money does not move.
- **Multi-tenancy** — one landlord per deployment.

---

## 8. Testing and evaluation

### 8.1 Unit tests (Vitest, 14/14 passing)

```
Test Files  4 passed (4)
     Tests  14 passed (14)
  Duration  5.49s
```

| File                               | Coverage                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/test/branding.test.ts`        | DEFAULT_BRANDING shape, hex validation (3/8-char), contrast ≥ 4.5, `isUsableAccent`                                              |
| `src/test/format.test.ts`          | `pesewasFromCedi` (plain, thousands-separated, GHS-prefixed), `friendlyError` (Convex error unwrap, plain passthrough, fallback) |
| `src/test/auth-validation.test.ts` | email/password strength, match/confirm                                                                                           |
| `src/test/app-routing.test.tsx`    | root route renders without crash                                                                                                 |

### 8.2 End-to-end browser verification (scripted, 2026-11-14)

49 scripted actions, 0 console errors throughout.

| #   | Flow                                                                   | Result                  |
| --- | ---------------------------------------------------------------------- | ----------------------- |
| 1   | Prod: sign-up → profile created, first account = admin                 | ✅ Admin role confirmed |
| 2   | Prop → 2 units → tenant Kwame Asante → lease → invoice INV-1001        | ✅ all created          |
| 3   | Payment RCP-1001 → invoice flips to `paid`, rate 100%                  | ✅                      |
| 4   | Cross-tenant: Ama sees zero of Kojo's data                             | ✅ isolation holds      |
| 5   | Branding: change accent to #2563EB → favicon/title/all accents re-skin | ✅                      |
| 6   | Reset to defaults → all reverts cleanly                                | ✅                      |
| 7   | Non-admin: Branding tab hidden; direct mutation throws                 | ✅                      |
| 8   | Sign-out → full reload → sign in → dashboard hydrates                  | ✅                      |
| 9   | 404 route renders branded "Page not found"                             | ✅                      |

### 8.3 Design system audit (automated detector, post-sweep)

The impeccable design detector was run against all changed source files after the mobile overhaul and design sweep:

```
Findings: []   (0 issues)
```

Previously identified violations that were fixed before this result:

- `border-l-4 border-primary` side-tab accent (payment list)
- `border-l-2` colored left-borders (all error/status message locations — 6 files)
- Decorative sparkline bars with hard-coded data (Dashboard KPI card)
- Eyebrow/kicker above auth page heading

### 8.4 Build verification

```
✔ built in 1.47s
```

`npm run build` exits 0. `tsc --noEmit` exits 0. ESLint exits 0.

### 8.5 Performance

- SSR shell renders instantly; client hydrates with Convex (~50–100 ms)
- Dashboard queries filtered by `by_landlord` + date range — index-only
- Static assets fingerprinted, served from Cloudflare edge
- Chart `XAxis` skips every other label on mobile (`interval={isMobile ? 1 : 0}`) to prevent overlap
- `stagger-children` entrance animation uses CSS animation-delay — zero JS overhead

### 8.6 Security and privacy checklist

- ✅ Passwords only via Convex Auth (never logged, never in source)
- ✅ Deploy keys in `*.local` only; gitignored; never committed
- ✅ `VITE_CONVEX_URL` is the **public** URL (safe to commit); Convex secrets stay in Convex's environment
- ✅ Every query/mutation enforces auth + ownership server-side
- ✅ File uploads validated content-type + ≤ 1 MB
- ✅ No PII in logs; errors shown to users are plain language
- ⚠ A seeded admin account is live on the prod deployment with a known demo password — **change before or immediately after submission** (`migration:setAdmin` or via dashboard)

---

## 9. Deployment and operations

### 9.1 Environments

| Env        | Frontend                                                 | Backend (Convex)          | Seeded data                         |
| ---------- | -------------------------------------------------------- | ------------------------- | ----------------------------------- |
| local dev  | localhost:8081 (`npm run dev`)                           | `dev:adorable-pig-437`    | 1 admin + 1 member, partial dataset |
| production | https://final-year-rent-project.edimamfaidol.workers.dev | `prod:usable-penguin-827` | 1 admin + minimal demo set          |

### 9.2 Release process

```bash
# 1. backend (schema/functions)
npx convex deploy --env-file .env.production.local

# 2. frontend — push to main branch triggers Workers Builds automatically
git push origin main

# 3. emergency manual deploy
npm run build
npx wrangler deploy

# 4. verify
npx convex run branding:get --env-file .env.production.local
```

### 9.3 Operator migrations

| Command                                                                        | Purpose                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------- |
| `npx convex run migration:backfillAdmin --env-file .env.local`                 | promote earliest profile if none is admin   |
| `npx convex run migration:setAdmin '{"email":"you@example.com"}'`              | force-set the single admin by email         |
| `npx convex run migration:adoptLandlordData '{"fromEmail":"…","toEmail":"…"}'` | move all dataset ownership between accounts |
| `npx convex run migration:renameDefaultBrand`                                  | one-time rename of the default brand        |
| `npx convex run migration:deleteDraftInvoiceByNumber '{"number":"INV-1002"}'`  | operator cleanup of draft duplicates        |

### 9.4 Live URLs

- **App:** https://final-year-rent-project.edimamfaidol.workers.dev
- **Repo:** https://github.com/BRIGHTEDUFUL/sankofa-rent
- **Convex prod:** `usable-penguin-827.convex.cloud`
- **Convex dev:** `adorable-pig-437.convex.cloud`

---

## 10. Limitations and future work

| #   | Limitation                                        | Remediation                                                                |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Optional external SMS/WhatsApp broadcast gateway  | wire Arkesel/mNotify for outbound push; in-app notice board already active |
| 2   | No MoMo collection webhooks                       | Paystack/Hubtel webhook → verify signature → `payments.record`             |
| 3   | Automated email OTP password delivery             | wire Resend SMTP; admin-managed temporary password flow already active     |
| 4   | Single-landlord deploy                            | keep two Convex deployments for demo/prod                                  |
| 5   | Seed data is a demo, not production-grade tenants | export-import flow for real onboarding                                     |
| 6   | No offline mode                                   | Convex caches recent queries; cache-first-then-sync would extend this      |
| 7   | No audit log                                      | add `auditEvents` table for financial mutations                            |
| 8   | No unit/e2e suite in CI                           | add GitHub Actions: `npm ci && npm run build && npm test`                  |
| 9   | No screenshot regression suite                    | add Playwright visual snapshots against the live URL                       |
| 10  | Demo admin password is known                      | change via `migration:setAdmin` before or after submission                 |

---

## 11. Conclusion

Sankofa Rent exists, is deployed, and works. A landlord signs up, is automatically made admin, adds a property and two units, registers a tenant, draws a lease, raises November's invoice, and records the MoMo payment — with a receipt that exists for posterity. The dashboard shows the same fact pattern in every screenshot.

The application is re-brandable at runtime by the admin, from inside the app, without a rebuild. The backend enforces ownership server-side. The mobile experience is native-feel: iOS translucency, Android Material 3 animations, platform-aware navigation, page transitions. The visual design system passes an automated anti-pattern detector with zero findings. The frontend compiles with zero TypeScript errors, zero ESLint errors, zero uncaught exceptions, and all 14 unit tests pass.

For a final-year project, that is what completion looks like.

---

## 12. References

- Convex Documentation, _Introduction to Convex_, convex.dev/docs
- TanStack, _TanStack Start_, tanstack.com/start/v1/docs
- Cloudflare Workers, _Cloudflare Workers_, workers.cloudflare.com/learn
- Tailwind CSS v4, tailwindcss.com
- Framer Motion, _Motion for React_, motion.dev
- Recharts, _Recharts documentation_, recharts.org
- Akan Adinkra symbolism — _Sankofa_, Ghana Museums and Monuments Board
- Material Design 3, _Design system for Android_, m3.material.io
- Apple Human Interface Guidelines, _iOS Navigation_, developer.apple.com/design
- WebAIM, _Contrast Checker_, webaim.org/resources/contrastchecker
- Ghana Revenue Service, _Ghana cedi_, 2026

---

## 13. Appendix A — Screenshots

### A.1 Sign-in (custom courtyard imagery, auth layout)

![Sign in](assets/login.jpeg)

### A.2 Dashboard (seeded demo data, 50% occupancy)

![Dashboard](assets/dashboard.jpeg)

### A.3 Settings → Branding (admin-only live rebranding)

![Branding](assets/branding.jpeg)

---

## 14. Appendix B — Project structure

```
convex/                 backend: schema, functions, auth, crons, migrations, generated code
src/
  components/
    app/                shell: Card, Button, Badge, AppShell, DataPage, FormDialog
    auth/               AuthLayout + form primitives (Field, SubmitButton, AuthNotice)
    ui/                 Radix primitives (select, dialog, sheet, switch, input …)
  hooks/                use-platform.ts, use-ripple.ts, use-mobile.ts
  lib/                  convex.tsx, branding.tsx, format.ts, haptics.ts, auth-validation.ts
  routes/               TanStack file-routes (13 routes)
  styles.css            Tailwind v4: tokens, utilities, platform CSS, dark mode
docs/                   this report + assets + CONVEX_MIGRATION.md
public/                 favicon.svg, manifest.webmanifest, icons/, robots.txt
```

---

## 15. Appendix C — Route map

| Route              | Screen                                                                     | Signed-in required |
| ------------------ | -------------------------------------------------------------------------- | ------------------ |
| `/login`           | Sign in                                                                    | ❌                 |
| `/signup`          | Create account                                                             | ❌                 |
| `/forgot-password` | Request admin password reset                                               | ❌                 |
| `/`                | Dashboard                                                                  | ✅                 |
| `/properties`      | Properties & units                                                         | ✅                 |
| `/tenants`         | Tenants                                                                    | ✅                 |
| `/leases`          | Leases                                                                     | ✅                 |
| `/invoices`        | Rent invoices                                                              | ✅                 |
| `/payments`        | Payments & receipts                                                        | ✅                 |
| `/maintenance`     | Maintenance requests                                                       | ✅                 |
| `/announcements`   | Announcements                                                              | ✅                 |
| `/settings`        | Profile · Business · Branding · Notifications · Payment methods · Security | ✅                 |
| `*`                | 404 — branded not-found page                                               | ❌                 |

---

## 16. Appendix D — Backend function inventory

See §6.7. All functions are exported from their respective module files in `convex/`. Internal cron jobs are defined in `convex/crons.ts` and call `internal.invoices.markOverdue`, `internal.invoices.generateMonthly`, and `internal.leases.flagExpiring`. The `migration.ts` module holds operator one-shots used during seeding and hand-off of the demo dataset.

---

## 17. Appendix E — Test evidence

```
 Test Files  4 passed (4)
      Tests  14 passed (14)
   Start at  20:06:11
   Duration  5.49s
```

Coverage includes:

- `pesewasFromCedi` — 6 input cases (plain, thousands-separated, GHS-prefixed, GH₵-prefixed, with whitespace, with commas)
- `friendlyError` — Convex error wrapper unwrap, plain string passthrough, fallback string
- `isUsableAccent` / contrast — WCAG 4.5:1 required; curated swatches verified
- Sign-up / sign-in password validation rules
- Root route renders without crash

---

## 18. Appendix F — Deployed environment

```
production   final-year-rent-project.edimamfaidol.workers.dev
backend      usable-penguin-827.convex.cloud
dev          adorable-pig-437.convex.cloud   (localhost:8081 via `npm run dev`)
repo         github.com/BRIGHTEDUFUL/sankofa-rent
```

**Key dependencies (production build):**

| Package          | Version | Role                                                |
| ---------------- | ------- | --------------------------------------------------- |
| react            | 19.2.0  | UI framework                                        |
| @tanstack/start  | 1.168.x | SSR router/framework                                |
| convex           | 1.50.0  | Backend platform                                    |
| @convex-dev/auth | 0.0.98  | Email + password auth                               |
| tailwindcss      | 4.x     | Styling                                             |
| framer-motion    | 14.14.0 | Animations (page transitions, M3 pill, More drawer) |
| recharts         | 2.x     | Dashboard bar chart                                 |
| lucide-react     | 0.575.0 | Icon library                                        |
| date-fns         | 4.1.0   | Date formatting                                     |

---

_Sankofa Rent — Ghana, 2026. Authored by Edith Nonnon._
