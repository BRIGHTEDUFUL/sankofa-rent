# Sankofa Rent — Convex Backend Migration Guide

This guide describes the migration of this app to Convex (database, auth, functions, file storage, scheduled jobs).

**Implementation status (14 November 2026): complete, including deployments.**
`convex/` holds the schema and one function file per screen; the frontend reads live data
through `useQuery`; `src/lib/mock.ts` is deleted. Auth is email + password only
(`@convex-dev/auth` 0.0.98). **Both deployments are live and verified, and the production
frontend is deployed on Cloudflare Workers:**

| Deployment | Role | Auth keys | Live test |
|---|---|---|---|
| `dev:adorable-pig-437` (`.env.local`) | development | SITE_URL/JWT/JWKS ✅ | Kojo + Ama test accounts |
| `prod:usable-penguin-827` (`.env.production.local`, gitignored) | production backend | SITE_URL/JWT/JWKS ✅ | One seeded admin account + minimal data |
| `edith-nonnon-project` (Cloudflare Worker) | production frontend | n/a | https://edith-nonnon-project.edimamfaidol.workers.dev — renamed from `rentwise-ghana` 2026-11-14 |

The full user journey was browser-verified against **dev** (sign-up, login, CRUD, invoice,
payment, branding, non-admin gating) and against **prod** (sign-up → first account becomes
admin → minimal data set → dashboard). See the **As-built & runbook** section at the end.
Still out of scope: Google sign-in, password-reset emails, SMS/WhatsApp delivery, MoMo
collection webhooks, file ownership registry — see `convex/README.md`.

---

## 1. Install

```bash
npm install convex @convex-dev/auth @auth/core
npx convex dev            # creates the convex/ folder + deployment, writes VITE_CONVEX_URL to .env.local
npx @convex-dev/auth      # sets JWT_PRIVATE_KEY, JWKS, SITE_URL on the deployment
```

The ready-made backend files are already in `convex/` (see `convex/README.md`). This guide explains them.

---

## 2. Schema — `convex/schema.ts`

Money is stored as **integer pesewas** (GH₵ 1 = 100), which avoids floating-point rounding errors. Dates are stored as epoch ms. Domain rows have a `landlordId`; profiles use `userId`. These fields do not enforce access by themselves: every query and mutation must enforce ownership.

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    businessName: v.optional(v.string()),
    region: v.optional(v.string()),
    currency: v.literal("GHS"),
    momoNumber: v.optional(v.string()),
    momoNetwork: v.optional(v.union(v.literal("MTN"), v.literal("Telecel"), v.literal("AirtelTigo"))),
    bankName: v.optional(v.string()),
    bankAccount: v.optional(v.string()),
    rentDueDay: v.number(),            // e.g. 5
    lateFeePercent: v.optional(v.number()),
    notifySms: v.boolean(),
    notifyEmail: v.boolean(),
    notifyWhatsapp: v.boolean(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("business")),
  }).index("by_user", ["userId"]),

  properties: defineTable({
    landlordId: v.id("users"),
    name: v.string(),
    area: v.string(),                  // "Adenta, Accra"
    region: v.optional(v.string()),
    ghanaPostGps: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
  }).index("by_landlord", ["landlordId"]),

  units: defineTable({
    landlordId: v.id("users"),
    propertyId: v.id("properties"),
    label: v.string(),                 // "A3", "2B"
    bedrooms: v.optional(v.number()),
    rent: v.number(),                  // pesewas / month
    status: v.union(v.literal("vacant"), v.literal("occupied"), v.literal("maintenance")),
  }).index("by_property", ["propertyId"]).index("by_landlord", ["landlordId"]),

  tenants: defineTable({
    landlordId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    ghanaCardNo: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    unitId: v.optional(v.id("units")),
    since: v.number(),
    archived: v.boolean(),
  }).index("by_landlord", ["landlordId"]).index("by_unit", ["unitId"]),

  leases: defineTable({
    landlordId: v.id("users"),
    tenantId: v.id("tenants"),
    unitId: v.id("units"),
    start: v.number(),
    end: v.number(),
    rent: v.number(),                  // pesewas / month
    advanceMonths: v.number(),         // validate the applicable legal limit for the tenancy before launch
    deposit: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("expiring"), v.literal("ended")),
    documentId: v.optional(v.id("_storage")),
  }).index("by_landlord", ["landlordId"]).index("by_tenant", ["tenantId"]).index("by_end", ["landlordId", "end"]),

  invoices: defineTable({
    landlordId: v.id("users"),
    leaseId: v.id("leases"),
    tenantId: v.id("tenants"),
    number: v.string(),                // "INV-1042"
    period: v.string(),                // "2026-11"
    dueDate: v.number(),
    amount: v.number(),
    paid: v.number(),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("partial"), v.literal("paid"), v.literal("overdue")),
  }).index("by_landlord", ["landlordId"]).index("by_status", ["landlordId", "status"]).index("by_tenant", ["tenantId"]),

  payments: defineTable({
    landlordId: v.id("users"),
    tenantId: v.id("tenants"),
    invoiceId: v.optional(v.id("invoices")),
    receiptNo: v.string(),             // "RCP-0881"
    method: v.union(v.literal("mtn_momo"), v.literal("telecel_cash"), v.literal("airteltigo_money"), v.literal("bank"), v.literal("cash")),
    reference: v.optional(v.string()),
    amount: v.number(),
    paidAt: v.number(),
  }).index("by_landlord", ["landlordId", "paidAt"]).index("by_tenant", ["tenantId"]),

  maintenance: defineTable({
    landlordId: v.id("users"),
    unitId: v.optional(v.id("units")),
    propertyId: v.id("properties"),
    title: v.string(),
    description: v.optional(v.string()),
    reportedBy: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved")),
    cost: v.optional(v.number()),
    photoIds: v.optional(v.array(v.id("_storage"))),
  }).index("by_landlord", ["landlordId"]).index("by_status", ["landlordId", "status"]),

  announcements: defineTable({
    landlordId: v.id("users"),
    title: v.string(),
    body: v.string(),
    propertyId: v.optional(v.id("properties")), // undefined = all properties
    pinned: v.boolean(),
    channels: v.array(v.union(v.literal("sms"), v.literal("email"), v.literal("whatsapp"))),
  }).index("by_landlord", ["landlordId"]),

  counters: defineTable({ landlordId: v.id("users"), name: v.string(), value: v.number() })
    .index("by_name", ["landlordId", "name"]),
});
```

---

## 3. Auth — `convex/auth.ts`

The sign-in, sign-up and forgot-password screens map to the Password provider. The "Continue with Google" button maps to Google.

```ts
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Google],
});
```

`convex/http.ts`:
```ts
import { httpRouter } from "convex/server";
import { auth } from "./auth";
const http = httpRouter();
auth.addHttpRoutes(http);
export default http;
```

Google: set `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in the Convex deployment. Configure the Google callback URL to the deployment's HTTP actions URL plus `/api/auth/callback/google` (use the `.convex.site` URL, not `.convex.cloud`). Set `SITE_URL` to the actual frontend origin, separately for development and production. Store secrets in Convex's environment settings, never frontend `VITE_*` variables or committed files.

Password reset is **not** enabled by `providers: [Password, Google]`. Create `convex/ResendOTPPasswordReset.ts` using the custom email-provider example in the [Password provider docs](https://labs.convex.dev/auth/config/passwords), install its additional dependencies with `npm install resend @oslojs/crypto`, import the exported provider into `convex/auth.ts`, and replace `Password` with `Password({ reset: ResendOTPPasswordReset })`. `ResendOTPPasswordReset` is a file you create, not a built-in export. Set `AUTH_RESEND_KEY` on Convex and use a verified sender domain; the example sender is not a production sender.

The forgot-password page needs two states, with errors and a pending state on both:
```ts
// Step 1: request the email code; preserve email for step 2.
await signIn("password", { email, flow: "reset" });
// Step 2: submit the emailed code and the replacement password.
await signIn("password", { email, code, newPassword, flow: "reset-verification" });
```
Never show a success message unless the request succeeded. Email verification is a separate Password `verify` configuration and is not enabled in the minimal example.

`convex/auth.config.ts` (the `@convex-dev/auth` setup creates this; keep it):
```ts
export default { providers: [{ domain: process.env.CONVEX_SITE_URL, applicationID: "convex" }] };
```

**Create the landlord profile on sign-up.** Add a callback to `convexAuth({...})`:
```ts
callbacks: {
  async afterUserCreatedOrUpdated(ctx, { userId }) {
    const existing = await ctx.db.query("profiles")
      .withIndex("by_user", q => q.eq("userId", userId)).unique();
    if (existing) return;
    await ctx.db.insert("profiles", {
      userId, firstName: "", lastName: "", currency: "GHS", rentDueDay: 5,
      notifySms: true, notifyEmail: true, notifyWhatsapp: false, plan: "free",
    });
  },
},
```
The existence check prevents duplicate profiles on account linking and also creates a missing profile when this callback runs for an existing account. Keep `profiles.update` an authenticated mutation that derives `userId` from `requireUser`; do not accept a user ID or client-controlled `plan`. Save the sign-up names and phone through that mutation only after `useConvexAuth().isAuthenticated` becomes true, not merely after `signIn` resolves (email verification may still be pending). If custom fields are passed to Password, configure its `profile` callback and extend the auth users schema accordingly; the default provider does not persist arbitrary form fields.

Shared helper — `convex/lib.ts`:
```ts
import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const id = await getAuthUserId(ctx);
  if (!id) throw new Error("Not signed in");
  return id;
}
export async function nextNumber(ctx: MutationCtx, landlordId: Id<"users">, name: string, prefix: string) {
  const c = await ctx.db.query("counters").withIndex("by_name", q => q.eq("landlordId", landlordId).eq("name", name)).unique();
  const value = (c?.value ?? 1000) + 1;
  if (c) await ctx.db.patch(c._id, { value });
  else await ctx.db.insert("counters", { landlordId, name, value });
  return `${prefix}-${value}`;
}
```

---

## 4. Functions per screen

Follow the same pattern in every file: `requireUser`, then query by `landlordId`, and check ownership before any patch or delete.

```ts
// convex/tenants.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";

export const list = query({ args: {}, handler: async (ctx) => {
  const me = await requireUser(ctx);
  return ctx.db.query("tenants").withIndex("by_landlord", q => q.eq("landlordId", me))
    .filter(q => q.eq(q.field("archived"), false)).collect();
}});

export const create = mutation({
  args: { name: v.string(), phone: v.string(), email: v.optional(v.string()), unitId: v.optional(v.id("units")) },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    if (a.unitId) {
      const u = await ctx.db.get(a.unitId);
      if (!u || u.landlordId !== me) throw new Error("Unit not found");
      if (u.status !== "vacant") throw new Error("Unit is not available");
      await ctx.db.patch(a.unitId, { status: "occupied" });
    }
    return ctx.db.insert("tenants", { ...a, landlordId: me, since: Date.now(), archived: false });
  },
});
```

| Screen (route) | Queries | Mutations |
|---|---|---|
| Dashboard `/` | `dashboard.summary` (collected this month, occupancy %, arrears, expected), `dashboard.monthly` (6-month chart), `payments.recent`, `maintenance.open` | — |
| Properties `/properties` | `properties.list` (with unit counts and occupancy) | `properties.create/update/remove`, `units.create/update` |
| Tenants `/tenants` | `tenants.list` (+ balance = sum of unpaid invoices) | `tenants.create/update/archive` |
| Leases `/leases` | `leases.list` | `leases.create/renew/end`, `files.generateUploadUrl` |
| Invoices `/invoices` | `invoices.list` | `invoices.create`, `invoices.send`, `invoices.generateMonthly` (internal) |
| Payments `/payments` | `payments.list` | `payments.record` (insert payment, increase `invoice.paid`, set status to partial/paid, generate the receipt number) |
| Maintenance `/maintenance` | `maintenance.list` | `maintenance.create/updateStatus` |
| Announcements `/announcements` | `announcements.list` | `announcements.create/pin/remove`, then an action sends SMS |
| Settings `/settings` | `profiles.me` | `profiles.update`, `auth.signOut` |

Recording a payment:
```ts
// convex/payments.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, nextNumber } from "./lib";

export const record = mutation({
  args: { tenantId: v.id("tenants"), invoiceId: v.optional(v.id("invoices")), amount: v.number(),
          method: v.union(v.literal("mtn_momo"), v.literal("telecel_cash"), v.literal("airteltigo_money"), v.literal("bank"), v.literal("cash")),
          reference: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    if (!Number.isSafeInteger(a.amount) || a.amount <= 0) throw new Error("Amount must be positive integer pesewas");
    const tenant = await ctx.db.get(a.tenantId);
    if (!tenant || tenant.landlordId !== me) throw new Error("Tenant not found");
    const receiptNo = await nextNumber(ctx, me, "receipt", "RCP");
    if (a.invoiceId) {
      const inv = await ctx.db.get(a.invoiceId);
      if (!inv || inv.landlordId !== me || inv.tenantId !== a.tenantId) throw new Error("Invoice not found");
      if (inv.status === "draft") throw new Error("Invoice has not been issued");
      if (a.amount > inv.amount - inv.paid) throw new Error("Payment exceeds invoice balance");
      const paid = inv.paid + a.amount;
      await ctx.db.patch(inv._id, { paid, status: paid === inv.amount ? "paid" : inv.dueDate < Date.now() ? "overdue" : "partial" });
    }
    return ctx.db.insert("payments", { ...a, landlordId: me, receiptNo, paidAt: Date.now() });
  },
});
```

The internal jobs the crons call (`convex/invoices.ts`):
```ts
import { internalMutation } from "./_generated/server";
import { nextNumber } from "./lib";

export const markOverdue = internalMutation({ args: {}, handler: async (ctx) => {
  const now = Date.now();
  for (const status of ["sent", "partial"] as const) {
    const rows = await ctx.db.query("invoices").filter(q => q.and(
      q.eq(q.field("status"), status), q.lt(q.field("dueDate"), now))).collect();
    for (const inv of rows) await ctx.db.patch(inv._id, { status: "overdue" });
  }
}});

export const generateMonthly = internalMutation({ args: {}, handler: async (ctx) => {
  const d = new Date(); const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  const nextMonth = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  const leases = await ctx.db.query("leases").filter(q => q.and(
    q.neq(q.field("status"), "ended"), q.lt(q.field("start"), nextMonth),
    q.gt(q.field("end"), monthStart))).collect();
  for (const l of leases) {
    const exists = await ctx.db.query("invoices").withIndex("by_tenant", q => q.eq("tenantId", l.tenantId))
      .filter(q => q.and(q.eq(q.field("leaseId"), l._id), q.eq(q.field("period"), period))).first();
    if (exists) continue;                        // safe to re-run
    const profile = await ctx.db.query("profiles").withIndex("by_user", q => q.eq("userId", l.landlordId)).unique();
    const day = profile?.rentDueDay ?? 5;
    if (!Number.isInteger(day) || day < 1 || day > 31) throw new Error("Invalid rent due day");
    const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    // Due through the end of the selected Ghana/UTC calendar day.
    const due = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), Math.min(day, daysInMonth) + 1) - 1;
    const number = await nextNumber(ctx, l.landlordId, "invoice", "INV");
    await ctx.db.insert("invoices", { landlordId: l.landlordId, leaseId: l._id, tenantId: l.tenantId,
      number, period, dueDate: due, amount: l.rent, paid: 0, status: "draft" });
  }
}});
```
At larger scale, process landlords in batches with `ctx.scheduler.runAfter` to stay within Convex's per-mutation limits.

These examples assume exclusive lease end timestamps and full monthly charges for a lease overlapping the month; decide on proration and advance-rent allocation before implementing billing. Creating an invoice is not sending it: `invoices.send` must explicitly issue a draft, with delivery recorded separately. Failed SMS/email must be retryable without issuing a second invoice. Drafts are deliberately excluded from the overdue job.

The third job referenced below also needs an implementation (`convex/leases.ts`):
```ts
import { internalMutation } from "./_generated/server";

export const flagExpiring = internalMutation({ args: {}, handler: async (ctx) => {
  const now = Date.now();
  const horizon = now + 60 * 24 * 60 * 60 * 1000;
  const rows = await ctx.db.query("leases")
    .filter(q => q.neq(q.field("status"), "ended")).collect();
  for (const lease of rows) {
    const status = lease.end <= now ? "ended" : lease.end <= horizon ? "expiring" : "active";
    if (lease.status !== status) await ctx.db.patch(lease._id, { status });
  }
}});
```
Lease status changes alone do not vacate a unit. End/renew/archive mutations must keep occupancy consistent and check for another current lease or tenant before freeing a unit.

---

## 5. Scheduled jobs — `convex/crons.ts`

```ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.daily("mark overdue invoices", { hourUTC: 6, minuteUTC: 0 }, internal.invoices.markOverdue);
crons.monthly("generate rent invoices", { day: 1, hourUTC: 6, minuteUTC: 0 }, internal.invoices.generateMonthly);
crons.daily("flag expiring leases", { hourUTC: 6, minuteUTC: 30 }, internal.leases.flagExpiring); // end within 60 days
export default crons;
```

---

## 6. External services (Convex actions, `"use node"` if needed)

- **SMS** (rent reminders, announcements): Hubtel, Arkesel or mNotify. Run `npx convex env set ARKESEL_API_KEY ...`
- **Mobile money collection**: Paystack (supports MTN, Telecel and AirtelTigo) or Hubtel. Set up a webhook route in `convex/http.ts` that verifies the signature and then calls `internal.payments.recordFromWebhook`.
- **Receipts as PDF**: an action that generates the PDF and stores it with `ctx.storage.store()`.
- **Email**: Resend.

---

## 7. Wire up the frontend

For this SSR app, put the Convex client and provider in a dedicated React module, then render that subtree beneath TanStack's `ClientOnly` with a stable loading fallback. Keep `QueryClientProvider` and the document shell intact; auth/provider initialization must not read browser storage during SSR. Do not use Next.js-only Convex Auth helpers or introduce another router.

Provider module sketch (create it before importing it from the root):
```tsx
import { useState, type ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

export function ConvexProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const url = import.meta.env.VITE_CONVEX_URL;
    if (!url) throw new Error("VITE_CONVEX_URL is required");
    return new ConvexReactClient(url);
  });
  return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>;
}
```
Place both public auth screens and the protected app beneath that provider after hydration; keep their current outside/inside `AppShell` distinction. Ensure the OAuth `code` query parameter survives the router's auth-page search validation until the provider consumes it. Verify Google return navigation with the actual deployed origin.

Replacing mock data on a page (example: `src/routes/tenants.tsx`):
```tsx
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
// Inside the component, after it is placed under the provider:
const { isAuthenticated } = useConvexAuth();
const rows = useQuery(api.tenants.list, isAuthenticated ? {} : "skip");
// undefined means loading/skipped, not an empty collection. Render an empty state only for [].
```
Format money as `cedi(row.rent / 100)`.

Login (`src/routes/login.tsx`):
```tsx
import { useAuthActions } from "@convex-dev/auth/react";
const { signIn } = useAuthActions();
await signIn("password", { email, password, flow: "signIn" });   // signup: flow: "signUp"
await signIn("google");
```
Each `Field` needs a `name`, and the form should read its values from `FormData`.

Auth pages: `/login`, `/signup`, `/forgot-password` render outside `AppShell` already, so they stay public.

For the initial client-only migration, gate protected children with `useConvexAuth`: show only the loading state while `isLoading`, and render no private children when signed out. Redirect from an effect with `navigate({ to: "/login", replace: true })`, never during render. Protected queries must use `"skip"` until authenticated. An effect-only redirect that still renders children can flash private content and run unauthorized queries. For subsequent protected loaders, move auth into router context and a pathless authenticated `beforeLoad` layout with `<Outlet />`; keep exactly one route claiming `/`.

Use `useAuthActions().signOut()` (not a custom mutation called `auth.signOut`), cancel and clear any TanStack Query private caches, then replace navigation to `/login`. Test Back after sign-out and signing into a second landlord account. UI gates are not authorization: `requireUser` and ownership checks remain mandatory inside Convex functions.

---

## 8. Migration checklist

1. Install packages and run `convex dev` and `@convex-dev/auth` (section 1).
2. Add schema, auth, http and lib (sections 2–3).
3. Write the function files for each screen (section 4).
4. Add the provider to `__root.tsx` and connect login, signup and forgot-password.
5. Replace each `import * as data from "@/lib/mock"` with `useQuery`. The stat cards come from `dashboard.summary`.
6. Connect the action buttons (Add tenant, Record payment, New lease, and so on) to dialogs that call mutations.
7. Add crons, SMS and MoMo webhooks.
8. Delete `src/lib/mock.ts`.
9. Deploy: `npx convex deploy`, then set `VITE_CONVEX_URL` to the production URL.

### Required implementation and acceptance checks

- **Missing functions:** implement every named query and mutation in section 4, `profiles.me/update`, `files.generateUploadUrl`, and the delivery/webhook actions before connecting their controls. The examples above do not provide a complete executable backend.
- **Ownership:** with two real test accounts, attempt reads and changes to the other landlord's properties, units, tenants, leases, invoices, payments, maintenance, announcements and files; reject each. Validate all linked records belong to the same owner and each other (including a maintenance unit's property). Never trust a submitted `landlordId`.
- **Settings:** validate money as safe integer pesewas, due day as an integer 1–31, nonnegative percentages and ordered lease dates. Allowlist writable profile fields; plan changes require trusted billing confirmation. Do not persist sample bank or contact details as real account defaults.
- **Payments:** test fractional, negative and zero amounts, a mismatched invoice, full settlement, partial overdue settlement and payment above the balance. The example rejects overpayment; implement a separate credit/allocation ledger if advance or excess payments are needed. Provider webhooks need signature verification over the raw body, server-side payment verification, amount/currency checks and a unique provider event/reference record written atomically with the payment, so retries cannot double-credit rent.
- **Jobs:** run monthly generation twice and assert one invoice per lease/period; test future and expired leases, month-end due days, late partial payments and the 60-day expiry boundary. Add indexes and pagination/batched jobs before using unbounded examples at scale. Test lease creation after the monthly job, so the first invoice is not missed.
- **Files:** require authentication to request uploads and register each uploaded storage ID with an owner. Verify ownership before attaching, downloading, replacing or deleting photos, agreements and receipts; a storage ID alone is not proof of ownership. Validate type and size, and clean up orphan uploads.
- **Auth:** test sign-up, duplicate email, wrong password, refresh persistence, Google callback, reset request plus code/new-password verification, and sign-out/Back in the real browser. Confirm exactly one profile per user and correct onboarding fields. Configure reset delivery before enabling password sign-in in production.
- **Data mapping:** Convex returns `_id`, epoch dates, enums and integer money, whereas mock rows contain display strings. Build explicit view adapters and relational joins; do not replace imports blindly. Derive dashboard totals from stored invoices/payments, never the mock statistics. Never import the made-up sample tenant data into a live landlord account.
- **Go-live:** keep development and production deployments and secrets separate. Run Convex code generation and checks against the actual deployment, then browser-test every page and action. Delete mock data only after the real flows pass. Until then, the current app remains frontend-only.

---

## As-built & runbook (14 November 2026)

### Branding & roles

- Global **branding** singleton in `convex/branding.ts` (`appName`, `tagline`, `accentColor`,
  optional `logoId` + `logoContentType`). **Publicly readable** (the login page shows it before
  any auth) and **writable by admins only** via `requireAdmin` in `convex/lib.ts`.
  A fresh deployment auto-creates no row; the UI falls back to `DEFAULT_BRANDING` in
  `src/lib/branding.tsx` (keep both copies in sync).
- `profiles.role: "admin" | "user"` (optional; `undefined` = member). The **first account on a
  deployment becomes admin** (`afterUserCreatedOrUpdated` in `convex/auth.ts`); later accounts
  are members. Admins see **Settings → Branding**; members don't (and the server rejects writes).
- The client drives **tab title**, **favicon** (root `<link rel="icon">`), and **accent color**
  (`--primary`/`--ring`/`--accent`/gradient via `color-mix`) from the stored brand. Route
  `head()` titles stay static because SSR cannot read the client-only Convex provider —
  `BrandingEffects` rewrites `document.title` at runtime instead.
- Resetting to defaults in Settings reverts name/tagline/accent and clears the custom logo;
  the tab title reverts too (`prevBrandNameRef` handles the transition).

### Operator commands (`npx convex run <file:function>`)

| Command | Purpose |
|---|---|
| `migration:backfillAdmin` | Promote earliest profile to admin iff none exists (safe to re-run) |
| `migration:setAdmin` | Force-set one admin by email; demotes other admins |
| `migration:renameDefaultBrand` | One-time rename of the default brand; skips customised rows |
| `migration:deleteDraftInvoiceByNumber` | Delete a DRAFT invoice (e.g. an accidental duplicate) |

Add `--env-file .env.production.local` to target prod instead of dev. Deploy keys live only in
the gitignored env files; never commit them.

### Deployment runbook

1. Dev loop: `npm run dev` (talks to `dev:adorable-pig-437` from `.env.local`).
2. Backend-only sync: `npx convex dev --once`.
3. Auth keys (once per deployment): `npx @convex-dev/auth` — sets `SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`.
4. Prod backend: `npx convex deploy --env-file .env.production.local` (already done — schema,
   indexes, functions and auth keys pushed on 2026-11-14).
5. Prod frontend env: `.env.production` is committed (public only — not a secret) and pins
   `VITE_CONVEX_URL=https://usable-penguin-827.convex.cloud`; a host-set build variable
   overrides it.
6. Prod frontend (Cloudflare Workers, 2026-11-14): `npm run build` → `npx wrangler deploy`
   (root `wrangler.jsonc`; Worker `edith-nonnon-project` (renamed from `rentwise-ghana`); assets served via the `ASSETS` binding).
   Live at https://edith-nonnon-project.edimamfaidol.workers.dev. The old `rentwise-ghana`
   Worker remains live until deleted in the Cloudflare dashboard. Pushes to `main` also trigger the Workers Builds build.
   CI is npm-only — `bun.lock`/`bunfig.toml` were removed because a stale bun lockfile was
   failing `bun install --frozen-lockfile` on every push.
7. Prod smoke test: `npx convex run branding:get --env-file .env.production.local` →
   returns `{ appName: "Sankofa Rent", tagline: "…", accentColor: "#4E735A", logoUrl: null }`.

### Test evidence (2026-11-14)

Browser-verified against **dev** (Kojo admin + Ama member):
- Signup → profile auto-created; first account = admin; second = member.
- Empty states everywhere; dashboard zeros; cross-tenant isolation (Ama sees none of Kojo's data).
- Property → 2 units → tenant → lease (double-book rejected) → invoice INV-1001 → send →
  payment RCP-1001 (invoice flips to paid, collected GH₵ 1,600.00, rate 100%).
- Duplicate invoice creation rejected with a friendly error (`Invoice INV-1001 already covers…`).
- Settings: profile/business/payment-methods saved; branding changed live (name, tagline,
  color, logo) and restored via *Reset to defaults*.
- Non-admin: Branding tab hidden; Security shows *Member*.
- Forgot-password shows the honest not-enabled state; demo links/Google button removed.
- Unit tests: 14/14 (`npm test`) — branding, pesewasFromCedi, auth validation.

Seeded against **prod** (fresh deployment):
- One admin account signup (first-account rule) → `Admin` role confirmed in Security tab.
- Minimal display dataset: 1 property (Adenta Court), units A1/A2, 1 tenant (Kwame Asante),
  lease to 2027-12-31, INV-1001 sent, payment RCP-1001 (invoice paid), 1 open maintenance
  request, 1 announcement; dashboard shows occupancy 50%, collected GH₵ 1,850.00, rate 100%.

### Credentials

The seeded prod admin credentials are delivered privately with this delivery (not in the
repo). Rotate the password after the first login.

### Known limitations

- SSR `head()`/og meta are static at build time — crawlers see the default name/tagline;
  the in-app tab title updates at runtime.
- Brief first-paint of default accent before branding loads (client-only provider).
- Custom logo serves from Convex storage (`*.convex.cloud`), not same-origin.
- `branding.get` is readable pre-auth by design; do not store anything sensitive in it.
