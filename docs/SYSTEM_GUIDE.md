# Sankofa Rent — System Guide

> The practical reference for understanding, operating, and extending the app.
> Authored by **Edith Mama**, Final-Year Project 2026.

This document explains the system from the inside out: what every core module does,
how the pieces connect, the rules the backend enforces, and the things you must
know to run, change, or demo the app safely.

---

## Contents

1. [What the app does (one page)](#1-what-the-app-does)
2. [How the layers connect](#2-how-the-layers-connect)
3. [The database — tables and rules](#3-the-database)
4. [Money and dates — the two invariants](#4-money-and-dates)
5. [Authentication and roles](#5-authentication-and-roles)
6. [Backend functions — what each one does](#6-backend-functions)
7. [Scheduled jobs (crons)](#7-scheduled-jobs)
8. [The branding system](#8-the-branding-system)
9. [The mobile shell](#9-the-mobile-shell)
10. [Frontend modules](#10-frontend-modules)
11. [Error handling](#11-error-handling)
12. [Running the app](#12-running-the-app)
13. [Deployment](#13-deployment)
14. [Operator commands](#14-operator-commands)
15. [What is not implemented](#15-what-is-not-implemented)
16. [Quick-reference cheat sheet](#16-quick-reference-cheat-sheet)

---

## 1. What the app does

Sankofa Rent is a web application for a **single Ghanaian landlord** to manage their rental portfolio end to end. Everything that used to happen across exercise books, WhatsApp, and scattered MoMo receipts happens here instead.

**The eight core workflows:**

```
1. Properties & units  →  add a building, add its rooms/flats, set their rent
2. Tenants             →  register a tenant, assign them to a unit
3. Leases              →  create a formal agreement (start/end, rent, advance, deposit)
4. Invoices            →  create a rent invoice → send it to the tenant
5. Payments            →  record MoMo / bank / cash payment → receipt issued automatically
6. Maintenance         →  log a repair request, track it to resolution
7. Announcements       →  send a notice to all tenants or one property's tenants
8. Dashboard           →  one-screen view of occupancy, arrears, collection, 6-month chart
```

**Plus two administrative capabilities:**

```
Settings → Branding   (admin only)  rename the app, change colours, upload a logo
Settings → Profile    (all users)   personal info, business details, payment methods
```

---

## 2. How the layers connect

```
Browser (React 19, TanStack Router, TanStack Query)
  │
  │  <BrandingProvider>  — public query, feeds name/accent/logo to every page
  │  <AppShell>          — desktop header + sidebar, mobile top bar + bottom nav
  │  <Outlet>            — the active route renders here
  │
  ▼  Convex client (WebSocket, persistent connection)
  │
Convex Cloud (usable-penguin-827)
  │  Every query/mutation receives a JWT from the browser
  │  requireUser() extracts the userId; never trust the client's claim
  │
  ├─ database (11 tables)
  ├─ 3 scheduled cron jobs
  └─ file storage (logos, future: lease docs, photos)
  │
Cloudflare Workers (SSR shell)
  └─ serves the HTML shell and static assets
     Convex talks directly to the browser — the Worker does not proxy it
```

The Worker only handles SSR (the initial HTML) and static files. All live data flows over the Convex WebSocket directly between the browser and the Convex cloud.

---

## 3. The database

Eleven tables. Every domain table carries a `landlordId` field that ties rows to their owner. **The database does not enforce ownership** — every query and mutation in `convex/lib.ts` does, by calling `requireUser()` and comparing `landlordId` to the authenticated user.

### Table by table

#### `profiles`

One row per user account. Created automatically when a user signs up (via `afterUserCreatedOrUpdated` in `convex/auth.ts`). Stores everything the landlord fills in under Settings.

Key fields:

- `userId` — foreign key into Convex's auth `users` table
- `role` — `"admin"` or `"user"` (optional field; `undefined` = regular user)
- `currency` — always `"GHS"`, not client-writable
- `plan` — `"free"` / `"pro"` / `"business"`, not client-writable
- `rentDueDay` — integer 1–31; used by the monthly invoice cron
- `momoNumber` / `momoNetwork` — displayed on receipts (payment collection is not automated)

#### `branding`

One row for the whole deployment (singleton). Publicly readable — the login page shows it before any authentication. Only admins can write it. If the row doesn't exist the app falls back to `DEFAULT_BRANDING` in `src/lib/branding.tsx`.

Key fields:

- `accentColor` — hex string; must pass 4.5:1 contrast vs white (enforced server-side)
- `logoId` — Convex storage ID; `null` means use the default Sun icon

#### `properties`

A building or compound the landlord manages.

Key fields: `name`, `area` (neighbourhood + city), `region`, `ghanaPostGps`

#### `units`

Individual rentable rooms or flats inside a property.

Key fields:

- `rent` — monthly rent in **pesewas** (integer)
- `status` — `"vacant"` | `"occupied"` | `"maintenance"`
- Status is kept consistent by mutations: creating a tenant with a unit sets it `"occupied"`, ending a lease sets it back to `"vacant"`.

#### `tenants`

One row per registered tenant. Tenants are never deleted — they are **archived** (`archived: true`). Their financial history (invoices, payments) stays linked.

Key fields: `name`, `phone`, `email`, `ghanaCardNo`, `emergencyContact`, `unitId`, `since`

**Balance** (the amount owed) is **not stored** — it is derived at query time as the sum of `amount - paid` across unpaid invoices for that tenant. This keeps the balance always correct without needing a separate update on every payment.

#### `leases`

The formal agreement between landlord and tenant for a unit.

Key fields:

- `start` / `end` — epoch ms; `end > start` enforced server-side
- `rent` — pesewas/month (may differ from the unit's default rent)
- `advanceMonths` — months of rent paid in advance at lease start
- `deposit` — optional security deposit in pesewas
- `status` — `"active"` | `"expiring"` | `"ended"` (managed by the daily cron and by `leases.end`)

A unit can only have one active lease at a time — `leases.create` checks for this.

#### `invoices`

A single rent invoice issued for one lease and one calendar period.

Key fields:

- `number` — human-readable, e.g. `INV-1042` (sequential per landlord via `counters`)
- `period` — `"YYYY-MM"` string
- `dueDate` — epoch ms (midnight UTC on the due day)
- `amount` — total in pesewas
- `paid` — amount received so far in pesewas
- `status` — `"draft"` → `"sent"` → `"partial"` / `"paid"` / `"overdue"`

**Status transitions:**

- `draft` → `"sent"`: landlord manually sends it via the Send button
- `sent` / `partial` → `"overdue"`: daily cron at 06:00 UTC if `dueDate < now`
- `sent` → `"partial"`: first partial payment recorded
- `partial` / `sent` → `"paid"`: payment covers the full amount

The cron creates invoices as `"draft"` automatically on the 1st of each month. Landlords manually send them.

**Duplicate guard:** `invoices.create` queries for an existing row with the same `leaseId + period` before inserting. Running the cron twice is safe.

#### `payments`

One row per payment event. Payments are immutable once created — there is no edit or delete.

Key fields:

- `receiptNo` — `RCP-1001`… (sequential per landlord via `counters`)
- `method` — `"mtn_momo"` | `"telecel_cash"` | `"airteltigo_money"` | `"bank"` | `"cash"`
- `reference` — optional MoMo transaction ID or bank reference
- `invoiceId` — optional; a payment without an invoice is an advance or unallocated payment
- `amount` — pesewas; must not exceed the invoice outstanding balance

**Overpayment guard:** `payments.record` reads the invoice's outstanding balance (`amount - paid`) and throws if the payment would exceed it.

#### `maintenance`

A repair or service request.

Key fields:

- `priority` — `"low"` | `"medium"` | `"high"`
- `status` — `"open"` → `"in_progress"` → `"resolved"` (manual; no cron)
- `unitId` — optional; whole-property requests leave this empty
- `cost` — optional resolution cost in pesewas

#### `announcements`

A broadcast message to tenants published to the in-app Tenant Notice Board (`/notices`).

Key fields:

- `channels` — defaults to `["in_app"]` (backward compatible with legacy arrays)
- `propertyId` — if set, targets a specific property; if absent, all properties
- `pinned` — pinned announcements appear first with urgent highlighting

**Delivery:** Announcements publish immediately to the in-app Tenant Notice Board (`/notices`) where tenants can view them on mobile or desktop without requiring third-party SMS or WhatsApp subscriptions.

#### `counters`

Two rows per landlord: one for invoice numbering (`name: "invoice"`) and one for receipts (`name: "receipt"`). Starting value: 1000, so the first invoice is `INV-1001`.

---

## 4. Money and dates

These two rules underpin every financial calculation. Violating either causes bugs that are hard to find and expensive to fix.

### Money: always integer pesewas

```
GH₵ 1,850.00  →  stored as  185000  (pesewas)
GH₵    0.50   →  stored as      50
```

**Why:** JavaScript `Number` cannot represent all decimal fractions exactly. Storing `1850.00` as a float invites rounding errors that compound across dozens of transactions.

**How it works in code:**

- `pesewasFromCedi(str)` in `src/lib/format.ts` — parses what users type (handles `"1,600"`, `"GH₵ 1,600.00"`, `"GHS 1600"`) and returns integer pesewas
- `cediFromPesewas(n)` — formats pesewas for display using `toLocaleString("en-GH")`
- The database validator uses `v.number()` — Convex integers are safe up to 2^53
- `Number.isSafeInteger(amount)` checked in `payments.record` before every insert

**Never store or display fractional pesewas.** `Math.round(cedi * 100)` is used in `pesewasFromCedi`.

### Dates: always epoch milliseconds UTC

```
"2026-11-14"  →  stored as  Date.UTC(2026, 10, 14)  =  1763164800000
```

**How it works in code:**

- `msFromDateInput(str)` in `src/lib/format.ts` — parses `YYYY-MM-DD` HTML input values to UTC epoch ms
- `formatDate(ms)` — renders `"14 Nov 2026"` using `toLocaleDateString("en-GH", {timeZone:"UTC"})`
- `formatDateTime(ms)` — renders date + time
- `formatMonth(period)` — renders `"2026-11"` → `"Nov 2026"`
- `Date.now()` used throughout for "current time" in mutations

---

## 5. Authentication and roles

### Sign-up flow

```
User submits email + password
  → Convex Auth's Password provider hashes and stores it
  → afterUserCreatedOrUpdated() callback fires
      → checks if any profile row exists for this deployment
      → if none: creates profile with role = "admin"
      → if any exist: creates profile with role = "user"
  → user is now signed in
```

**The first account on a fresh deployment automatically becomes admin.** Every subsequent account is a regular user. This means: sign up with the demo/presentation account first, before creating any test accounts.

### Session handling

Sessions are JWTs stored in `localStorage` by `ConvexAuthProvider`. Every Convex request sends the JWT in the WebSocket handshake. The server calls `getAuthUserId(ctx)` to extract the authenticated user ID.

`requireUser(ctx)` in `convex/lib.ts`:

```typescript
const id = await getAuthUserId(ctx);
if (!id) throw new Error("Not signed in");
return id; // the userId
```

Every query and mutation calls this first. If unauthenticated, it throws — the client receives the error and the UI stays on the login page.

### Admin check

`requireAdmin(ctx)` in `convex/lib.ts`:

```typescript
const userId = await requireUser(ctx);
const profile = await ctx.db
  .query("profiles")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .unique();
if (!profile || profile.role !== "admin") throw new Error("Admin access required");
return userId;
```

Only `branding.update` calls this. The Settings → Branding tab is hidden in the UI for non-admins, but the server rejects the mutation regardless of what the UI shows. **UI gates are not authorization.**

### Sign-out

```typescript
await signOut(); // clears the JWT from localStorage
window.location.assign("/login"); // hard reload — recreates the Convex client
```

The hard reload is intentional. Without it, the module-level `ConvexReactClient` retains stale WebSocket state from the previous session and subsequent sign-ins can get wedged showing the previous user's data.

---

## 6. Backend functions

Every function file in `convex/` follows this pattern:

1. Call `requireUser(ctx)` to get `landlordId`
2. Query with `.withIndex("by_landlord", ...)` to scope data
3. For writes: verify the target row belongs to this landlord before patching/deleting

### `profiles.ts`

| Function | Type     | What it does                                                                                                                |
| -------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `me`     | query    | Returns the signed-in user's profile row                                                                                    |
| `update` | mutation | Updates allowed fields only. `plan`, `currency`, `role` are **not** in the allowlist — they cannot be changed by the client |

### `dashboard.ts`

| Function  | Type  | What it does                                                                                                                              |
| --------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `summary` | query | Returns: `collectedThisMonth`, `expectedThisMonth`, `arrears`, `occupancyPercent` — all computed server-side from invoices/payments/units |
| `monthly` | query | Returns 6 months of `{label, due, collected}` for the bar chart                                                                           |

Dashboard totals are computed on the server, not in the browser. This prevents N+1 queries and means the KPI numbers are always consistent.

### `properties.ts`

| Function     | Type     | What it does                                                    |
| ------------ | -------- | --------------------------------------------------------------- |
| `list`       | query    | Returns all properties with their units and an `occupied` count |
| `create`     | mutation | Inserts a new property                                          |
| `update`     | mutation | Updates name/area/region/GPS; verifies ownership                |
| `remove`     | mutation | Deletes property; also deletes all its units                    |
| `addUnit`    | mutation | Adds a unit to a property; verifies property ownership          |
| `updateUnit` | mutation | Updates unit label/rent/bedrooms/status; verifies ownership     |

### `tenants.ts`

| Function  | Type     | What it does                                                                                       |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `list`    | query    | Returns active (non-archived) tenants with their derived `balance` (sum of unpaid invoice amounts) |
| `create`  | mutation | Creates tenant; if `unitId` provided, marks that unit `"occupied"`                                 |
| `update`  | mutation | Updates tenant details; does not change unit assignment (leases manage that)                       |
| `archive` | mutation | Sets `archived: true`; tenant disappears from the list but their history is kept                   |

**Important:** `list` only returns `archived: false` tenants. Archived tenants still own their historical invoices and payments. The balance calculation joins invoices live — it is never stored.

### `leases.ts`

| Function       | Type              | What it does                                                                                                 |
| -------------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `list`         | query             | Returns all leases with tenant/unit names joined                                                             |
| `create`       | mutation          | Creates a lease; validates dates + rent; verifies the unit is vacant or already assigned to this tenant      |
| `renew`        | mutation          | Updates `end` date to a new later date; status back to `"active"`                                            |
| `end`          | mutation          | Sets status to `"ended"`; sets unit status back to `"vacant"`                                                |
| `flagExpiring` | internal mutation | Called by cron: sets `"expiring"` for leases ending within 60 days, `"ended"` for leases past their end date |

**Unit assignment rule:** When creating a lease, the unit must be either:

- `status === "vacant"`, or
- the unit currently assigned to the selected tenant (allowing a lease to be formalised for an already-occupying tenant)

This is checked both in the UI dropdown and server-side in `leases.create`.

### `invoices.ts`

| Function          | Type              | What it does                                                                                                                       |
| ----------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `list`            | query             | Returns all invoices, newest first                                                                                                 |
| `create`          | mutation          | Creates a draft invoice; rejects if a row already exists for the same `leaseId + period`                                           |
| `send`            | mutation          | Transitions `draft → sent`; throws if already sent                                                                                 |
| `generateMonthly` | internal mutation | Called by cron on the 1st of each month: creates draft invoices for all active leases; skips if one already exists for that period |
| `markOverdue`     | internal mutation | Called by cron daily: sets `sent`/`partial` invoices to `overdue` if `dueDate < now`                                               |

**Invoice status rules:**

- Only `"draft"` invoices can be sent
- `"draft"` invoices are excluded from the overdue cron
- A payment on a fully-paid invoice is rejected by `payments.record`

### `payments.ts`

| Function | Type     | What it does                                                                                      |
| -------- | -------- | ------------------------------------------------------------------------------------------------- |
| `list`   | query    | Returns all payments, newest first                                                                |
| `record` | mutation | Records a payment; issues a receipt number; updates the linked invoice's `paid` amount and status |

**What `record` does in detail:**

1. Validates `amount` is a positive safe integer
2. Looks up the tenant — throws if not found or not owned by this landlord
3. Generates a receipt number via `nextNumber(ctx, landlordId, "receipt", "RCP")`
4. If `invoiceId` is provided:
   - Verifies the invoice belongs to this landlord and this tenant
   - Verifies `invoice.status !== "draft"` (can't pay an unsent invoice)
   - Verifies `amount <= invoice.amount - invoice.paid` (no overpayment)
   - Updates `invoice.paid += amount`
   - Sets `invoice.status` to `"paid"` (if fully paid) or `"overdue"` / `"partial"`
5. Inserts the payment row

### `maintenance.ts`

| Function       | Type     | What it does                                                                |
| -------------- | -------- | --------------------------------------------------------------------------- |
| `list`         | query    | Returns all maintenance requests with property/unit names                   |
| `create`       | mutation | Creates a request; `unitId` is optional (whole-property requests have none) |
| `updateStatus` | mutation | Advances status: `open → in_progress → resolved → open` (cyclic)            |

### `announcements.ts`

| Function    | Type     | What it does                                                               |
| ----------- | -------- | -------------------------------------------------------------------------- |
| `list`      | query    | Returns announcements, pinned first                                        |
| `create`    | mutation | Creates announcement; requires at least one channel; `propertyId` optional |
| `togglePin` | mutation | Flips `pinned` boolean                                                     |
| `remove`    | mutation | Deletes the announcement permanently                                       |

### `branding.ts`

| Function | Type     | What it does                                                                                                                                                                                |
| -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`    | query    | Returns the branding row (or `null` if none — client falls back to `DEFAULT_BRANDING`). **No auth required** — login page needs it                                                          |
| `update` | mutation | Requires admin. Updates name/tagline/accent; validates accent contrast (4.5:1 vs white); handles logo upload: if `logoId` is `null`, deletes the old file from storage and clears the field |

### `files.ts`

| Function            | Type     | What it does                                                                                                                                                              |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generateUploadUrl` | mutation | Returns a short-lived Convex storage upload URL. Requires auth. The caller POSTs the file directly to this URL, then passes the returned `storageId` to `branding.update` |

### `migration.ts`

Operator-only one-shot functions. Run via `npx convex run`. Never called from the UI.

| Function                     | Purpose                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `backfillAdmin`              | Makes the earliest profile admin if none currently are                                                         |
| `setAdmin`                   | Force-sets one specific account as admin by email; demotes all others                                          |
| `renameDefaultBrand`         | One-time rename from the old default brand name to `Sankofa Rent`                                              |
| `deleteDraftInvoiceByNumber` | Deletes a draft invoice by its number (e.g. `"INV-1002"`) — for cleaning accidental duplicates                 |
| `adoptLandlordData`          | Moves all data ownership from one account to another by email — used to hand the demo dataset to a new account |

---

## 7. Scheduled jobs

Defined in `convex/crons.ts`. Run automatically in the Convex cloud — no server management required.

| Job                      | Schedule                       | What it does                                                                                      |
| ------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `mark overdue invoices`  | Daily at 06:00 UTC             | Finds all `sent` and `partial` invoices where `dueDate < now` and sets them to `"overdue"`        |
| `generate rent invoices` | 1st of each month at 06:00 UTC | For every active or expiring lease, creates a draft invoice for the current period if none exists |
| `flag expiring leases`   | Daily at 06:30 UTC             | Sets lease status to `"expiring"` (ending within 60 days) or `"ended"` (past end date)            |

**Key property: idempotent.** The monthly invoice generation checks for an existing invoice before creating one. It is safe to run twice.

**Gap to know:** The `generateMonthly` job creates invoices as `"draft"` — they are not automatically sent to tenants. The landlord must manually click Send on each one, or the cron would need to be extended to call `invoices.send` and then a delivery API.

---

## 8. The branding system

This is the most distinctive engineering feature of the app. The admin can rename the app, change the accent colour, and upload a new logo — and every part of the app updates immediately, without a rebuild.

### How it works

```
Admin saves branding in Settings
  → branding.update mutation runs (admin-only)
  → Convex database row updated
  → useQuery(api.branding.get) in BrandingProvider re-runs (live subscription)
  → BrandingContext value updates
  → BrandingEffects() re-runs three useEffect hooks:
      1. applyAccentColor(hex) → overwrites CSS variables on :root
      2. applyFavicon(url)     → replaces the <link rel="icon"> href
      3. title rewriter        → MutationObserver rewrites document.title on every navigation
```

### CSS variable injection

`applyAccentColor` sets these variables directly on `document.documentElement`:

```
--primary           → the hex colour
--ring              → same (focus ring)
--accent            → color-mix(oklch, hex 12%, white)  (hover backgrounds)
--primary-soft      → same as accent
--primary-foreground → #ffffff
--gradient-primary  → linear-gradient(135deg, lighter, darker)
```

If the accent is reset to `DEFAULT_BRANDING.accentColor` (`#4E735A`), all overrides are removed and the OKLCH values in `styles.css` take over. This means the default deployment has zero runtime style overrides.

### Title rewriting

Route `head()` functions in TanStack Router write titles like `"Tenants — Sankofa Rent"` at build time (SSR). These can't read the Convex branding. `BrandingEffects` installs a `MutationObserver` on `<head>` that watches for title changes and rewrites `" — Sankofa Rent"` to `" — Custom Name"` on every SPA navigation.

**The infinite-loop guard:** The observer checks `current === lastApplied` before every write. If the title it would write is the same as what it last wrote, it returns without touching the DOM — which means the observer never fires on its own write.

### Logo upload flow

```
1. User picks a file (< 1 MB, image/* validated)
2. generateUploadUrl mutation returns a one-time Convex storage URL
3. Browser POSTs the raw file bytes to that URL
4. Convex returns a storageId
5. branding.update is called with { logoId: storageId }
6. The old logoId (if any) is deleted from storage
7. BrandingProvider re-fetches → new logo URL in BrandingContext → favicon updates
```

---

## 9. The mobile shell

### Platform detection (`src/hooks/use-platform.ts`)

Called in `__root.tsx` (before any child renders) and in `AppShell`. Reads `navigator.userAgent` once, caches the result module-level, and writes `document.documentElement.dataset.platform = "ios" | "android" | "other"`. This attribute drives CSS rules in `styles.css` for iOS translucency and Android M3 backgrounds without JS conditionals in the render tree.

### `MobileTopBar` (hidden on `sm+`)

Fixed at the top. Shows:

- **Top-level routes** (`/`, `/properties`, `/tenants`, `/payments`): logo in the left slot
- **Sub-routes** (`/leases`, `/invoices`, etc.): back chevron button (navigates to parent route)
- **iOS:** page title centred; **Android/other:** left-aligned
- Right slot: Bell icon (links to `/announcements`) and avatar initials (links to `/settings`)

Scrolled state: when `window.scrollY > 10`, adds a shadow and `bg-background/90` backdrop.

### `BottomTabBar` (hidden on `sm+`)

Fixed at the bottom. Five slots:

- Slots 1–4: `PRIMARY_TABS` = Home, Properties, Tenants, Payments
- Slot 5: More button → opens the More drawer

**Android:** Framer Motion `motion.div` with `layoutId="tab-pill"` slides an `h-8 w-16` pill to the active slot position using a spring animation.

**iOS:** Active icons use `fill="currentColor"` on the SVG to match iOS convention.

### More drawer

A Framer Motion bottom-sheet (`initial={{ y: "100%" }}`). Contains:

- User name and business name
- Grid of secondary nav items (Leases, Invoices, Maintenance, Announcements)
- Settings and Sign out in a grouped list
- Closes on backdrop tap or any navigation

### Keyboard offset

A `visualViewport` resize/scroll listener computes `window.innerHeight - vv.height - vv.offsetTop` and sets `--keyboard-offset` on `:root`. The `<main>` element uses this as `margin-bottom`, so the form fields stay above the soft keyboard.

---

## 10. Frontend modules

### `src/lib/format.ts`

All formatting and parsing helpers. Import from here — never `new Intl.NumberFormat` inline.

| Export                 | What it does                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| `cediFromPesewas(n)`   | Formats integer pesewas → `"GH₵ 1,850.00"`                              |
| `pesewasFromCedi(str)` | Parses user input → integer pesewas; returns `NaN` on invalid input     |
| `msFromDateInput(str)` | Parses `"YYYY-MM-DD"` → epoch ms UTC                                    |
| `formatDate(ms)`       | `"14 Nov 2026"`                                                         |
| `formatDateTime(ms)`   | `"14 Nov, 09:30"`                                                       |
| `formatMonth(period)`  | `"2026-11"` → `"Nov 2026"`                                              |
| `initials(name)`       | `"Kwame Asante"` → `"KA"`                                               |
| `PAYMENT_METHODS`      | Record mapping DB enum values to display strings                        |
| `friendlyError(err)`   | Strips the Convex error wrapper to surface the message the server wrote |

### `src/lib/branding.tsx`

- `BrandingProvider` — wraps the app, provides branding via React context
- `BrandingEffects` — mounted once; drives title, favicon and accent CSS variables
- `useBranding()` — hook for any component that needs `appName`, `tagline`, `accentColor`, `logoUrl`
- `isHexColor(s)` — validates a 6-character hex string
- `isUsableAccent(hex)` — WCAG 4.5:1 contrast check vs white
- `DEFAULT_BRANDING` — fallback used while the query is in flight

### `src/components/app/AppShell.tsx`

Exports:

- `AppShell` — the whole shell (header, sidebar, mobile nav); wraps `<Outlet />`
- `Card` — the rounded `animate-rise` white panel used everywhere
- `Badge` — small coloured pill (`tone: "green" | "red" | "gold" | "gray"`)
- `Button` — the app's primary and ghost button
- `cedi` — shorthand for `cediFromPesewas` (re-exported for convenience)

### `src/components/app/DataPage.tsx`

The reusable list page component used by Tenants, Leases, Invoices, Payments, Maintenance.

Takes:

- `title`, `subtitle`, `action`, `onAction` — page header
- `stats` — array of KPI cards shown above the list
- `columns` — column definitions with `key`, `label`, `render` function, optional `className`
- `rows` — data array

Renders:

- Mobile: stacked cards, first column + actions in top row, middle fields in a 2-column dl
- Desktop: a full table with header and hover rows

### `src/components/app/FormDialog.tsx`

- `FormDialog` — wraps `ResponsiveDialog` with a form, error state, and submit handler
- `ConfirmDialog` — destructive confirmation with Cancel and a coloured action button
- `TextField` — `Label + Input` pair wired to `FormData`
- `SelectField` — `Label + Select` (Radix) wired to `FormData`

### `src/components/auth/AuthLayout.tsx`

The two-column sign-in/sign-up layout (form left, courtyard photo right on `lg+`).

Exports:

- `AuthLayout` — outer wrapper with logo and footer
- `Field` — full-featured input with password toggle, hint, error state, aria wiring
- `SubmitButton` — full-width primary button with arrow icon
- `AuthNotice` — coloured pill banner for success/error feedback

---

## 11. Error handling

### Server errors → user messages

Convex errors from mutations look like:

```
[CONVEX M(invoices:create)] [Request ID: abc] Server Error
Uncaught Error: Invoice INV-1001 already covers this lease and period
  at handler (…)
```

`friendlyError(err)` in `src/lib/format.ts` extracts the `"Invoice INV-1001 already covers this lease and period"` part and returns it. If nothing matches, it returns the fallback string.

**Convention:** every mutation `catch` block calls `friendlyError` and displays the result in a `bg-destructive-soft` pill banner (`role="alert"`).

### Loading states

Every page checks `if (!data) return <skeletons />`. Convex queries return `undefined` while loading and the actual value once ready. The pattern used throughout:

```typescript
const tenants = useQuery(api.tenants.list, {});
if (!tenants) return <SkeletonList />;
// tenants is now Doc<"tenants">[]
```

### Empty states

Every list page has an empty state shown when `rows.length === 0` — an icon + heading + hint text. No list ever shows blank space or a confusing nothing.

---

## 12. Running the app

### Prerequisites

- Node.js **≥ 22**
- **npm** only — no bun, pnpm, or yarn (`package-lock.json` is the source of truth)

### First-time setup (Option 2 / Universal NPM workflow)

```bash
# 1. Install dependencies
npm install

# 2. Automated setup (creates .env.local + syncs Convex backend)
npm run setup

# 3. Start full stack in one command
npm run dev:full
# → http://localhost:3000
```

The first time you open http://localhost:3000 and sign up, that account becomes the admin.

### Available scripts

| Command                                              | What it does                                               |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| `npm run setup`                                      | Cross-platform setup: creates `.env.local` & verifies Convex|
| `npm run dev:full`                                   | Starts Convex backend + Vite frontend concurrently         |
| `npm run dev:backend`                                | Convex dev watcher in background window (`--env-file`)     |
| `npm run dev`                                        | Vite SSR dev server on port 3000                           |
| `npm test`                                           | Run Vitest unit tests (20 tests, 4 files)                  |
| `npm run lint`                                       | ESLint check — must exit 0 before committing               |
| `npm run build`                                      | Production Nitro build → `.output/`                        |
| `npx tsc --noEmit`                                   | TypeScript check — must exit 0 before committing           |
| `npx convex dev`                                     | Push schema/functions to dev deployment, watch for changes |
| `npx convex dev --once`                              | One-shot push (no watch)                                   |
| `npx convex deploy --env-file .env.production.local` | Push to production Convex backend                          |

### Environment files

| File                    | Contents                                                             | Committed?                          |
| ----------------------- | -------------------------------------------------------------------- | ----------------------------------- |
| `.env.local`            | `CONVEX_DEPLOYMENT=dev:adorable-pig-437` + `VITE_CONVEX_URL` for dev | ❌ gitignored                       |
| `.env.production.local` | `CONVEX_DEPLOYMENT=prod:usable-penguin-827` + production secrets     | ❌ gitignored                       |
| `.env.production`       | `VITE_CONVEX_URL=https://usable-penguin-827.convex.cloud`            | ✅ committed (public, not a secret) |

**Rule:** `VITE_CONVEX_URL` is the only Convex variable that is public and safe to commit. All other Convex secrets (`JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`) live inside the Convex deployment's environment settings, never in the repo.

---

## 13. Deployment

### Architecture

```
Push to main branch
  → Cloudflare Workers Builds (Git-connected) detects the push
  → runs npm run build → Nitro → .output/
  → deploys to: final-year-rent-project.edimamfaidol.workers.dev
```

The Convex backend is deployed separately and independently. Frontend and backend can be deployed in either order — the Convex URL is pinned in `.env.production`.

### Deploying the backend

```bash
npx convex deploy --env-file .env.production.local
```

This pushes the schema, all functions, and cron definitions to `prod:usable-penguin-827`. It does not affect the frontend. The deployed functions take effect immediately.

### Deploying the frontend (manual)

```bash
npm run build
npx wrangler deploy   # uses root wrangler.jsonc
```

This is only needed if Workers Builds is not available. Normal workflow is push to `main`.

### Two deployments

|          | Development          | Production                                       |
| -------- | -------------------- | ------------------------------------------------ |
| URL      | localhost:8081       | final-year-rent-project.edimamfaidol.workers.dev |
| Convex   | dev:adorable-pig-437 | prod:usable-penguin-827                          |
| Env file | .env.local           | .env.production.local                            |
| Data     | test accounts        | seeded demo dataset                              |

**They are completely isolated.** Data in dev cannot affect prod. Schema changes must be deployed to both.

---

## 14. Operator commands

Run these with `npx convex run <module:function> [args]`. Add `--env-file .env.production.local` to target production.

```bash
# Make the first account admin if none exists (safe to re-run)
npx convex run migration:backfillAdmin --env-file .env.production.local

# Force a specific account to be admin
npx convex run migration:setAdmin '{"email":"edith@example.com"}' --env-file .env.production.local

# Delete a specific draft invoice (e.g. a duplicate)
npx convex run migration:deleteDraftInvoiceByNumber '{"number":"INV-1002"}' --env-file .env.production.local

# Transfer all data from one account to another
npx convex run migration:adoptLandlordData '{"fromEmail":"old@example.com","toEmail":"new@example.com"}' \
  --env-file .env.production.local

# Rename the default brand (one-time)
npx convex run migration:renameDefaultBrand --env-file .env.production.local

# Check current branding
npx convex run branding:get --env-file .env.production.local
```

---

## 15. What is not implemented

These are **honest gaps** — the UI shows them honestly, the backend records the intent, but no external system is wired.

| Feature                  | Current state                       | What would be needed                                                                                                    |
| ------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| SMS delivery             | Channel recorded in DB              | Arkesel or mNotify API key; a Convex action calling their HTTP API                                                      |
| WhatsApp delivery        | Channel recorded                    | WhatsApp Business API or a gateway like mNotify                                                                         |
| Email delivery           | Channel recorded                    | Resend or SendGrid; a Convex action                                                                                     |
| Password reset           | Admin-managed reset flow            | Users request reset via `/forgot-password`; admins issue temporary passwords with mandatory first-login password update |
| MoMo collection webhooks | Reference stored manually           | Paystack or Hubtel webhook; signature verification; `payments.record` wired to it                                       |
| Google sign-in           | Provider code present, keys not set | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` environment variables in Convex                                                 |

---

## 16. Quick-reference cheat sheet

### Core data flow

```
Landlord signs up → becomes admin → adds property + units → registers tenant
  → creates lease (links tenant to unit)
  → creates invoice (links lease to period)
  → sends invoice (draft → sent)
  → records payment (payment → receipt issued; invoice → paid)
```

### Money rule

```
Everything in pesewas (integer).
Display: cediFromPesewas(n)  →  "GH₵ 1,850.00"
Parse:   pesewasFromCedi(str) →  185000
```

### Invoice lifecycle

```
draft  →[send]→  sent
sent   →[payment, partial]→  partial
sent / partial  →[cron, dueDate passed]→  overdue
sent / partial  →[payment, full]→  paid
```

### Lease lifecycle

```
active  →[cron, 60 days before end]→  expiring
active / expiring  →[cron, past end date]→  ended
active / expiring  →[landlord ends it]→  ended  (unit → vacant)
active / expiring  →[landlord renews]→  active  (new end date)
```

### Key file locations

| What                          | Where                                                  |
| ----------------------------- | ------------------------------------------------------ |
| Database schema               | `convex/schema.ts`                                     |
| Auth and role logic           | `convex/auth.ts`, `convex/lib.ts`                      |
| Scheduled jobs                | `convex/crons.ts`                                      |
| Branding system               | `convex/branding.ts` + `src/lib/branding.tsx`          |
| Money / date utils            | `src/lib/format.ts`                                    |
| App shell + Card/Badge/Button | `src/components/app/AppShell.tsx`                      |
| Mobile hooks                  | `src/hooks/use-platform.ts`, `src/hooks/use-ripple.ts` |
| CSS tokens and utilities      | `src/styles.css`                                       |
| All routes                    | `src/routes/`                                          |

### Ports and URLs

```
Dev frontend:    http://localhost:8081
Dev Convex:      https://adorable-pig-437.convex.cloud
Prod frontend:   https://final-year-rent-project.edimamfaidol.workers.dev
Prod Convex:     https://usable-penguin-827.convex.cloud
Repo:            https://github.com/BRIGHTEDUFUL/sankofa-rent
```

---

_Sankofa Rent — authored by Edith Mama, 2026._
