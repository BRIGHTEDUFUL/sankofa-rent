# Sankofa Rent — project roadmap

## Done (2026-11)

- [x] Full Convex migration: schema, auth, functions, crons, file storage
- [x] Email + password authentication, first-account-becomes-admin
- [x] All app pages connected to real queries/mutations; mock data deleted
- [x] Browser E2E pass (signup → lease → invoice → payment) against dev **and** production backend
- [x] Production backend deployed (`usable-penguin-827`) with auth keys and a seeded admin + minimal dataset
- [x] Custom branding: app name, tagline, logo, accent color — admin-only, live everywhere (auth pages, header, tab title, favicon, theme)
- [x] Roles: admin / member; first-account-becomes-admin enforced server-side
- [x] Duplicate-invoice guard, cedi parser tolerance, `friendlyError` surfacing
- [x] Frontend live on Cloudflare Workers — `final-year-rent-project`, https://final-year-rent-project.edimamfaidol.workers.dev (Git-connected Workers Builds on `main`)
- [x] CI fix: `bun.lock`/`bunfig.toml` dropped — npm-only; `package-lock.json` is source of truth

### Mobile-native overhaul (2026-11-14)

- [x] `usePlatform` hook — detects iOS/Android/other; stamps `data-platform` on `<html>` for CSS scoping
- [x] `useRipple` hook — Android Material 3 DOM ripple on tap
- [x] `haptics.ts` — `navigator.vibrate` wrappers for Android tap/medium feedback
- [x] `MobileTopBar` — fixed, `sm:hidden`; back button for sub-routes; iOS centred title / Android left-aligned; logo on top-level routes
- [x] `BottomTabBar` — 4 primary tabs + More drawer; Framer Motion M3 pill indicator (Android); iOS filled icons
- [x] More drawer — Framer Motion spring bottom-sheet with backdrop, user info, grid of secondary nav items, settings + sign-out
- [x] Page transitions — `AnimatePresence` wrapping main content; 150 ms ease-out fade + Y slide
- [x] Safe-area CSS variables (`--sat`, `--sab`, `--sar`, `--sal`) in `:root`; applied to top bar, bottom nav, sticky save bar
- [x] `dvh` / `pb-nav` / `hide-scrollbar` / `sticky-save-bar` Tailwind `@utility` declarations
- [x] iOS translucent tab bar (`backdrop-filter: saturate(180%) blur(20px)`)
- [x] Android M3 tab bar background + shadow
- [x] Keyboard offset via `window.visualViewport` — main content margin shrinks when soft keyboard appears
- [x] iOS input zoom prevention — `md:text-sm` removed from Input component
- [x] Form grid fixes — `grid-cols-1 sm:grid-cols-2` on all four form-pair grids (invoices, payments, maintenance, leases)
- [x] Recharts overflow guard — `overflow-hidden` wrapper on chart container
- [x] Settings chip tab strip (scrollable, `hide-scrollbar`) + sticky save bar on mobile
- [x] Properties/announcements action button sizes — `h-10 sm:h-8`; `h-10 w-10 sm:h-8 sm:w-8`
- [x] `AuthLayout` — `min-h-dvh` replacing `min-h-svh`; `truncate` on brand name
- [x] PWA foundation — `manifest.webmanifest`, `apple-touch-icon.png`, icon PNGs (192/512/maskable), dual `theme-color` meta (light/dark)
- [x] Dark mode token set (OKLCH) in `@media (prefers-color-scheme: dark)` + `:root.dark` class + `:root.light` override
- [x] Theme toggle in desktop sidebar (Sun/Moon)

### Design system sweep (2026-11-14)

- [x] Removed `border-l-4 border-primary` side-tab accent from Dashboard payment list (banned pattern)
- [x] Replaced all `border-l-2` colored left-borders on error/status messages (6 files) with pill banners using `bg-destructive-soft` / `bg-primary-soft`
- [x] Removed decorative hard-coded sparkline bars from Dashboard KPI card (not from real data)
- [x] Removed eyebrow/kicker (`text-xs font-semibold uppercase`) above auth page h1; tagline moved to aside caption
- [x] Auth aside: added `bg-gradient-to-t from-ink via-ink/60 to-transparent` scrim so text always reads against the photo
- [x] `animate-rise` easing improved: 500 ms ease-out → 350 ms cubic-bezier spring
- [x] `stagger-children` Tailwind utility for list entrance animation (mobile cards, property grid)
- [x] Browser surfaces themed: `caret-color: var(--primary)`, `::selection` tinted, custom scrollbars
- [x] Empty states upgraded: icon + heading + hint on Properties; secondary hint line on DataPage
- [x] Desktop header: tighter proportions; bell/avatar hover states; `hover:ring-border` on avatar
- [x] Desktop sidebar: `gap-1.5`, `h-[18px] w-[18px]` icons, consistent `hover:text-foreground` + `transition-colors` on all buttons
- [x] Dashboard grid: `space-y-3 sm:space-y-0 sm:grid` → pure `grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4` (no layout shift)
- [x] Property card rent roll: `border-t border-border/60` (lighter separator); rent value gets `tabular-nums`
- [x] 404/error pages: `min-h-dvh`, contextual icon, `pressable` buttons
- [x] Settings status messages: pill banner pattern applied
- [x] Automated detector run on all changed files: **0 findings**

## Next

- [ ] Rotate the seeded admin password after the first production login
- [ ] Verify Google sign-in if wanted for the demo — currently email + password only
- [ ] Add a `og:image` / share preview screenshot so the live URL previews correctly on social links

## Later / out of scope for the final-year submission

- [ ] SMS / WhatsApp delivery for announcements (Arkesel or mNotify) and rent reminders
- [ ] MoMo collection webhooks (MTN/Telecel/AirtelTigo) with signature verification
- [ ] Password reset emails (Resend OTP flow — documented in `docs/CONVEX_MIGRATION.md`)
- [ ] File ownership registry for uploads (photos, lease documents)
- [ ] Proration rules and advance-rent allocation for billing
- [ ] GitHub Actions CI: `npm ci && npm run build && npm test`
- [ ] Playwright visual regression snapshots against the live URL
- [ ] Audit log table (`auditEvents`) for financial mutations
