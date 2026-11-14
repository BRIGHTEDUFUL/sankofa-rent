# Mobile Audit — Phase 0 Findings

## What already works ✅
- Viewport meta: `width=device-width, initial-scale=1, viewport-fit=cover` in `src/routes/__root.tsx`
- Bottom tab bar is a full-width bar (not floating pill), with 3 primary tabs + More drawer
- DataPage switches table→card layout at `md` (768 px) — already responsive
- Forms open as Vaul bottom-sheet Drawers on mobile (`ResponsiveDialog`)
- Touch targets on action buttons are `h-11` (44 px)
- Safe-area insets applied inline in AppShell
- `pressable` utility with `:active` scale is defined in `styles.css`
- `overscroll-behavior-y: none` and `-webkit-tap-highlight-color: transparent` already set

## Real problems fixed ❌→✅
1. No global `box-sizing: border-box`, no `overflow-x: hidden` on html/body → root cause of wide pages
2. `whitespace-nowrap` + large GH₵ amounts in Dashboard KPI cards overflow at 320 px
3. `grid-cols-2` inside form Drawers (invoices, leases, maintenance forms) — 320–360 px columns too narrow
4. 14 px (`md:text-sm`) body/form text — triggers iOS zoom on input focus (`Input` component)
5. Recharts chart has no overflow guard — SVG escapes container on narrow screens
6. No CSS variables for safe-area insets (`--sat`, `--sab`, etc.) — repeated inline
7. No platform detection hook (`usePlatform`)
8. Top bar greeting ("Akwaaba, FirstName!") overflows on long names at 320 px
9. `min-h-screen` (100vh) used instead of `100dvh`
10. Settings has no scrollable chip tab bar on mobile detail view
11. No page transition animations
12. No native-feel: no iOS blur/translucency, no Material 3 ripple/pill indicator, no system fonts on mobile
