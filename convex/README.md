# Convex backend (ready to connect)

These files are the full backend for Nyumba Rent. They are not running yet.

## Connect in 4 steps
1. `bun add convex @convex-dev/auth @auth/core`
2. `bunx convex dev` — log in, create a project. This creates `convex/_generated/` and writes `VITE_CONVEX_URL` to `.env.local`.
3. `bunx @convex-dev/auth` — sets up sign-in keys.
4. Wrap the app in `ConvexAuthProvider` and swap `src/lib/mock.ts` data for `useQuery(api.<file>.list)` (see `docs/CONVEX_MIGRATION.md`, section 7).

## Files
| File | What it does |
|---|---|
| schema.ts | All tables (money stored in pesewas: GH₵1 = 100) |
| auth.ts, auth.config.ts, http.ts | Email + password sign-in; creates a profile on sign-up |
| lib.ts | `requireUser`, invoice/receipt numbering |
| dashboard.ts | Dashboard totals |
| properties.ts | Properties + units |
| tenants.ts, leases.ts | Tenants, leases (create/end) |
| invoices.ts, payments.ts | Invoices, record payment + receipt number |
| maintenance.ts, announcements.ts | Maintenance requests, announcements |
| profiles.ts | Settings page (my profile) |
| crons.ts | Daily overdue marking, monthly invoice generation, expiring leases |

Password reset emails are optional — see the guide if you want them.
