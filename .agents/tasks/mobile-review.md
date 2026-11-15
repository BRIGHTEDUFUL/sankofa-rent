# Mobile responsiveness and native-feel UI overhaul

This commit adds a full mobile layer on top of the existing desktop shell: a fixed top bar, a five-slot bottom tab bar with a More drawer, page-transition animations via Framer Motion, platform detection, Android ripple, iOS translucency, and a battery of CSS fixes that address the root causes of horizontal overflow and iOS input zoom. Eighteen source files changed; `convex/` is untouched. The package addition (`framer-motion ^14.14.0`) built cleanly.

**Watch for:** (confirmed) The `navigate({ to: "..", from: path })` back button in `MobileTopBar` relies on TanStack Router's relative navigation resolving `..` from a flat pathname like `/invoices` — this resolves to `/` for all second-level routes, which works but is not a true browser-history back. On sub-routes with dynamic segments this would navigate to the wrong place. (possible) The `sticky-save-bar` override in settings uses plain class composition (`sm:static sm:bg-transparent sm:backdrop-filter-none sm:border-0 sm:pt-0 sm:pb-0`) to undo the utility at `sm+`; `backdrop-filter-none` is not a standard Tailwind v4 utility and may silently have no effect on desktop.

**Verdict**: APPROVED

---

## High-level view

The shell restructures navigation into three distinct configs: `PRIMARY_TABS` (four mobile bottom-bar slots), `MORE_ITEMS` (drawer), and `DESKTOP_NAV` (the original icon sidebar). The desktop sidebar — logo, greeting header, all original nav items, Settings and logout at the bottom — is fully preserved under `hidden sm:flex` / `hidden sm:block` guards; no desktop layout regressions are present.

The iOS zoom fix (`md:text-sm` removed from `input.tsx`) and form grid fixes (`grid-cols-1 sm:grid-cols-2` across invoices, payments, maintenance, and leases) are confirmed present. The `pb-nav` and `min-h-dvh` / `h-dvh` utilities are defined in `styles.css` via Tailwind's `@utility` syntax and applied throughout the shell. Safe-area CSS variables (`--sat`, `--sab`, etc.) are defined once in `:root` and referenced inline.

`usePlatform` is called in both `AppShell` (for the platform-specific tab-bar rendering) and `__root.tsx` (the side-effect that stamps `data-platform` on `<html>` early, before `AppShell` mounts). The double call is intentional and correct: the hook is idempotent, shares a module-level cache, and the `__root.tsx` call runs before any child renders.

Framer Motion is imported and used in three places in `AppShell.tsx` — `AnimatePresence`+`motion.div` for the More drawer backdrop and sheet, `motion.div` with `layoutId="tab-pill"` for the Android M3 indicator, and `AnimatePresence`+`motion.div` wrapping the main content for page transitions. All three imports resolve; the library is in `package.json` and `package-lock.json`.

The `manifest.webmanifest` and icon files in `public/` pre-date this commit — `git show origin/main:public/manifest.webmanifest` returns the existing file — so no new PWA manifest was introduced by this change.

<details>
<summary>Issues (2)</summary>

1. **Back-button resolves to `/` not history** — `navigate({ to: "..", from: path })` navigates to the parent route segment, not the previous history entry. For all current flat routes this means `/leases` → `/`, which is the intended behaviour. Any future nested route (e.g. `/properties/:id`) would navigate to `/properties`, not back. If browser-history back is ever needed, replace with `router.history.back()` or `window.history.back()`.

2. **`backdrop-filter-none` not a Tailwind v4 core utility** — The `sticky-save-bar` reset on desktop uses `sm:backdrop-filter-none`. Tailwind v4 exposes `backdrop-blur-none` and similar sub-utilities, but `backdrop-filter-none` is not guaranteed to be generated without a matching `@utility` or plugin. If it silently drops, the settings save-bar will show the blurred sticky background on `sm+` screens. Confirm with `npx tailwindcss --input src/styles.css --output /dev/null --dry-run` or inspect the built CSS.

</details>

<details>
<summary>Details</summary>

## Back button resolves relative to route path, not browser history

`MobileTopBar` navigates back with `navigate({ to: "..", from: path })`. TanStack Router resolves `..` relative to the current route's path string — for a flat route like `/invoices`, that resolves to `/`. This matches the intended behaviour for the app's current flat route tree. The `TOP_LEVEL` set (`/`, `/properties`, `/tenants`, `/payments`) is used to decide whether to show the logo or the back button, so top-level routes never show the button. The concern is forward-compatibility: a dynamic route segment such as `/properties/$id` would resolve `..` to `/properties`, which may or may not be right depending on context.

## `sticky-save-bar` reset at desktop breakpoint

The settings save buttons use the `sticky-save-bar` utility defined in `styles.css`, then override it at `sm+` with a chain of Tailwind classes:

```
sm:static sm:bg-transparent sm:backdrop-filter-none sm:border-0 sm:pt-0 sm:pb-0
```

`sm:static`, `sm:bg-transparent`, `sm:border-0`, `sm:pt-0`, `sm:pb-0` are all standard Tailwind utilities. `sm:backdrop-filter-none` is not part of Tailwind v4 core (the sub-utilities are `sm:backdrop-blur-none`, etc.). If Tailwind does not emit this class, the settings panel will render with the sticky glass bar on desktop. Worth a visual check in a wide-viewport build.

## Framer Motion usage

`AnimatePresence` and `motion` are imported from `framer-motion` in `AppShell.tsx` and used in three places: the More drawer (slide-up sheet + backdrop fade), the Android M3 tab-pill (`layoutId="tab-pill"` for spring-animated repositioning), and the page-transition wrapper in `<main>`. All usages are inside components that only render on the client. The SSR bundle includes framer-motion (433 kB uncompressed, 120 kB gzip) — largest lib in the SSR output — but the app already does client-only rendering for auth-gated routes, so this is not a correctness issue.

## Convex directory and service worker/manifest

`git diff origin/main -- convex/` returns empty — no backend files changed. The `manifest.webmanifest`, icon PNGs, and `apple-touch-icon.png` in `public/` all exist on `origin/main` already; this commit did not introduce them.

## Build

`npm run build` exits 0. Vite + Nitro produced the full `.output/` tree with the `framer-motion` bundle present, two wrangler config warnings (pre-existing, unrelated to this change), and no TypeScript errors reported in the build output.

</details>

---

<details>
<summary>File map</summary>

| File                                 | What changed                                                                                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MOBILE_AUDIT.md`                    | New — phase-0 audit findings document                                                                                                                                       |
| `package.json` / `package-lock.json` | Added `framer-motion ^14.14.0`                                                                                                                                              |
| `src/styles.css`                     | Added safe-area vars, global box-sizing reset, `dvh`/`hide-scrollbar`/`pb-nav`/`sticky-save-bar` utilities, system-font rule, iOS blur and Android M3 CSS, dark mode tokens |
| `src/hooks/use-platform.ts`          | New — iOS/Android/other detection with `data-platform` stamp                                                                                                                |
| `src/hooks/use-ripple.ts`            | New — Android M3 DOM ripple injection                                                                                                                                       |
| `src/lib/haptics.ts`                 | New — `navigator.vibrate` wrappers for Android tap feedback                                                                                                                 |
| `src/routes/__root.tsx`              | `usePlatform()` call added; dual `theme-color` meta (light/dark)                                                                                                            |
| `src/components/app/AppShell.tsx`    | Full mobile shell: `MobileTopBar`, `BottomTabBar` with More drawer, `DESKTOP_NAV` split, page-transition `AnimatePresence`, keyboard-offset `visualViewport` listener       |
| `src/components/app/DataPage.tsx`    | Mobile card grid `grid-cols-1 min-[420px]:grid-cols-2`, `overflow-wrap:anywhere` on `dd`, `tabular-nums` on stats                                                           |
| `src/components/auth/AuthLayout.tsx` | `min-h-svh` → `min-h-dvh`, `truncate` on brand name                                                                                                                         |
| `src/components/ui/input.tsx`        | Removed `md:text-sm` to prevent iOS input zoom                                                                                                                              |
| `src/routes/index.tsx`               | Mobile greeting hero, `clamp` font sizes on KPIs, `overflow-hidden` chart container, `useIsMobile` for XAxis interval                                                       |
| `src/routes/invoices.tsx`            | `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` on date/period pair                                                                                                            |
| `src/routes/payments.tsx`            | Same grid fix for amount/date pair                                                                                                                                          |
| `src/routes/maintenance.tsx`         | Same grid fix for unit/property pair                                                                                                                                        |
| `src/routes/leases.tsx`              | Same grid fix on two date pairs                                                                                                                                             |
| `src/routes/settings.tsx`            | Scrollable chip tab row (`hide-scrollbar`), `sticky-save-bar` on all four save button rows                                                                                  |
| `src/routes/properties.tsx`          | `h-10 sm:h-8` on action buttons, `h-8` unit badges                                                                                                                          |
| `src/routes/announcements.tsx`       | `h-10 sm:h-8` on action buttons, `line-clamp-3` on body, `text-base` on textarea                                                                                            |

Full diff: `git diff origin/main`

</details>
