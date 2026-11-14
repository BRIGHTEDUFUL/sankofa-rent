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

## Next

- [ ] Deploy the frontend (Cloudflare Workers via nitro) and set `VITE_CONVEX_URL` to the prod deployment
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
