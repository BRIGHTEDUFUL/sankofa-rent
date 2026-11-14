# Convex backend

Email + password auth, a full rent-management schema and one function file per screen.
Money is stored as **integer pesewas** (GH₵ 1 = 100); dates are epoch ms. Every query and
mutation derives `landlordId` from the signed-in user — never from client input.

## Setup

```sh
npm install convex @convex-dev/auth @auth/core
npx convex dev            # connects to the deployment in .env.local, generates convex/_generated/
npx @convex-dev/auth      # sets JWT_PRIVATE_KEY, JWKS, SITE_URL on the deployment
```

`.env.local` (gitignored) must define:

```
CONVEX_DEPLOYMENT=dev:<project>|<token>
VITE_CONVEX_URL=https://<project>.convex.cloud
```

The frontend reads only `VITE_CONVEX_URL`. Production pins that variable in the committed
`.env.production` (public, no secrets — overridden by any host-set variable) so CI builds work;
Convex secrets live in the deployment's environment settings, never in the repo. The
production frontend runs on Cloudflare Workers (`rentwise-ghana`) — see `README.md → Deploying`.

## Files

| File | Exports |
|---|---|
| `schema.ts` | All tables (`profiles`, `branding`, `properties`, `units`, `tenants`, `leases`, `invoices`, `payments`, `maintenance`, `announcements`, `counters`) plus `authTables` |
| `auth.ts`, `auth.config.ts`, `http.ts` | Password sign-in; `afterUserCreatedOrUpdated` creates the profile (**first account on a deployment becomes admin**) |
| `lib.ts` | `requireUser`, `requireAdmin`, `nextNumber` (invoice/receipt numbering) |
| `dashboard.ts` | `summary`, `monthly` |
| `properties.ts` | `list`, `create`, `update`, `remove`, `addUnit`, `updateUnit` |
| `tenants.ts` | `list` (with derived balance), `create`, `update`, `archive` |
| `leases.ts` | `list`, `create`, `renew`, `end`, `flagExpiring` |
| `invoices.ts` | `list`, `create` (duplicate-safe per lease+period), `send`, `markOverdue`, `generateMonthly` |
| `payments.ts` | `list`, `record` (writes a receipt number and settles the invoice) |
| `maintenance.ts` | `list`, `create`, `updateStatus` |
| `announcements.ts` | `list`, `create`, `togglePin`, `remove` |
| `profiles.ts` | `me`, `update` (allowlisted, validated fields only) |
| `branding.ts` | `get` (public singleton), `update` (admin-only; logo verify + replace/delete) |
| `migration.ts` | `backfillAdmin`, `setAdmin`, `renameDefaultBrand`, `deleteDraftInvoiceByNumber` |
| `files.ts` | `generateUploadUrl` |
| `crons.ts` | Daily overdue marking, monthly invoice generation, 60-day lease expiry flagging |

## Not yet enabled

- **Google sign-in** — add the provider in `auth.ts` plus `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
- **Password reset** — needs a custom OTP email provider (e.g. Resend) and `AUTH_RESEND_KEY`.
- **SMS / WhatsApp delivery** for announcements, and **MoMo collection** webhooks.
- **File ownership registry** — `generateUploadUrl` exists, but uploaded storage IDs are not yet
  tied to an owner.

See `docs/CONVEX_MIGRATION.md` for the design notes and the pre-production acceptance checklist.
