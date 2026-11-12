# Nyumba Rent — Convex Backend Migration Guide

This app's screens are complete, and every screen reads from `src/lib/mock.ts`. This guide covers everything you need to move the data, sign-in and actions to Convex (database, auth, functions, file storage, scheduled jobs).

---

## 1. Install

```bash
bun add convex @convex-dev/auth @auth/core
bunx convex dev            # creates the convex/ folder + deployment, writes VITE_CONVEX_URL to .env.local
bunx @convex-dev/auth      # sets JWT_PRIVATE_KEY, JWKS, SITE_URL on the deployment
```

Add `convex/` to `tsconfig.json` "include" if it isn't picked up.

---

## 2. Schema — `convex/schema.ts`

Money is stored as **integer pesewas** (GH₵ 1 = 100), which avoids floating-point rounding errors. Dates are stored as epoch ms. Each row has a `landlordId`, so every landlord only sees their own data.

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
    advanceMonths: v.number(),         // Ghana Rent Act caps at 6 — validate in mutation if desired
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

Google: set `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` with `bunx convex env set`. For password reset, add `reset: ResendOTPPasswordReset` to Password (see the Convex Auth docs) and set `AUTH_RESEND_KEY`.

`convex/auth.config.ts` (the `@convex-dev/auth` setup creates this; keep it):
```ts
export default { providers: [{ domain: process.env.CONVEX_SITE_URL, applicationID: "convex" }] };
```

**Create the landlord profile on sign-up.** Add a callback to `convexAuth({...})`:
```ts
callbacks: {
  async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
    if (existingUserId) return;
    await ctx.db.insert("profiles", {
      userId, firstName: "", lastName: "", currency: "GHS", rentDueDay: 5,
      notifySms: true, notifyEmail: true, notifyWhatsapp: false, plan: "free",
    });
  },
},
```
Sign-up form: pass `firstName`/`lastName`/`phone` in `signIn("password", {...})`, then call `profiles.update` right after.

Shared helper — `convex/lib.ts`:
```ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
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
export const record = mutation({
  args: { tenantId: v.id("tenants"), invoiceId: v.optional(v.id("invoices")), amount: v.number(),
          method: v.union(v.literal("mtn_momo"), v.literal("telecel_cash"), v.literal("airteltigo_money"), v.literal("bank"), v.literal("cash")),
          reference: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    if (a.amount <= 0) throw new Error("Amount must be positive");
    const tenant = await ctx.db.get(a.tenantId);
    if (!tenant || tenant.landlordId !== me) throw new Error("Tenant not found");
    const receiptNo = await nextNumber(ctx, me, "receipt", "RCP");
    if (a.invoiceId) {
      const inv = await ctx.db.get(a.invoiceId);
      if (!inv || inv.landlordId !== me || inv.tenantId !== a.tenantId) throw new Error("Invoice not found");
      const paid = inv.paid + a.amount;
      await ctx.db.patch(inv._id, { paid, status: paid >= inv.amount ? "paid" : "partial" });
    }
    return ctx.db.insert("payments", { ...a, landlordId: me, receiptNo, paidAt: Date.now() });
  },
});
```

The internal jobs the crons call (`convex/invoices.ts`):
```ts
import { internalMutation } from "./_generated/server";

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
  const leases = await ctx.db.query("leases").filter(q => q.neq(q.field("status"), "ended")).collect();
  for (const l of leases) {
    const exists = await ctx.db.query("invoices").withIndex("by_tenant", q => q.eq("tenantId", l.tenantId))
      .filter(q => q.and(q.eq(q.field("leaseId"), l._id), q.eq(q.field("period"), period))).first();
    if (exists) continue;                        // safe to re-run
    const profile = await ctx.db.query("profiles").withIndex("by_user", q => q.eq("userId", l.landlordId)).unique();
    const due = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), profile?.rentDueDay ?? 5);
    const number = await nextNumber(ctx, l.landlordId, "invoice", "INV");
    await ctx.db.insert("invoices", { landlordId: l.landlordId, leaseId: l._id, tenantId: l.tenantId,
      number, period, dueDate: due, amount: l.rent, paid: 0, status: "sent" });
  }
}});
```
At larger scale, process landlords in batches with `ctx.scheduler.runAfter` to stay within Convex's per-mutation limits.

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

- **SMS** (rent reminders, announcements): Hubtel, Arkesel or mNotify. Run `bunx convex env set ARKESEL_API_KEY ...`
- **Mobile money collection**: Paystack (supports MTN, Telecel and AirtelTigo) or Hubtel. Set up a webhook route in `convex/http.ts` that verifies the signature and then calls `internal.payments.recordFromWebhook`.
- **Receipts as PDF**: an action that generates the PDF and stores it with `ctx.storage.store()`.
- **Email**: Resend.

---

## 7. Wire up the frontend

`src/routes/__root.tsx`, inside `RootComponent`:
```tsx
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
// create at module level (outside the component) so it isn't recreated on every render
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
// wrap: <ConvexAuthProvider client={convex}> ... </ConvexAuthProvider>
```

Replacing mock data on a page (example: `src/routes/tenants.tsx`):
```tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
const rows = useQuery(api.tenants.list) ?? [];   // was: data.tenants
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

Route protection: in `AppShell`, use `useConvexAuth()`. If `!isLoading && !isAuthenticated`, run `navigate({ to: "/login" })`. Pages render on the client, and Convex queries run on the client.

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
9. Deploy: `bunx convex deploy`, then set `VITE_CONVEX_URL` to the production URL.
