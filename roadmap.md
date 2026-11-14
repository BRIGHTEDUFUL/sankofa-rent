# Sankofa Rent — project roadmap

## Done (2026-11)

- [x] Full Convex migration: schema, auth, functions, crons, file storage
- [x] Email + password authentication, first-account-becomes-admin
- [x] All app pages connected to real queries/mutations; mock data deleted
- [x] Browser E2E pass (signup → lease → invoice → payment) against dev **and** production backend
- [x] Production backend deployed (`usable-penguin-827`) with auth keys and a seeded admin + minimal dataset
- [x] Custom branding: app name, tagline, logo, accent color — admin-only, live everywhere (auth pages, header, tab title, favicon, theme)
- [x] Roles: admin / member
- [x] Duplicate-invoice guard, parser tolerance for UI cedi formats, error surfacing (`friendlyError`)
- [x] Frontend live on Cloudflare Workers — `edith-nonnon-project` (Nitro `cloudflare-module`; renamed from `rentwise-ghana`, 2026-11-14), https://edith-nonnon-project.edimamfaidol.workers.dev (`.env.production` pins the public prod `VITE_CONVEX_URL`; pushes to `main` trigger Workers Builds)
- [x] CI fix: `bun.lock`/`bunfig.toml` dropped — the repo pins npm; a stale bun lockfile was failing `bun install --frozen-lockfile` on every build

## Next

- [ ] Verify the Workers Builds pipeline end to end (builds trigger on push to `main`; deploy was verified manually with `npx wrangler deploy` on 2026-11-14)
- [ ] Rotate the seeded admin password after the first production login
- [ ] Verify Google sign-in (if wanted for the demo) — currently email + password only
- [ ] Wire the code-split warning cleanup (`Page` exports in route files)
- [ ] Consider a build-time head/og meta (or edge-rendered `default`/default-share image) so crawlers see the real brand

## Later / out of scope for the final-year demo

- [ ] SMS / WhatsApp delivery for announcements (Arkesel or mNotify) and rent reminders
- [ ] MoMo collection webhooks (MTN/Telecel/AirtelTigo) with signature verification
- [ ] Password reset emails (Resend)
- [ ] File ownership registry for uploads (photos, lease documents)
- [ ] Proration rules and advance-rent allocation for billing
