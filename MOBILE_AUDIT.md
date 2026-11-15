# Mobile & UI Consistency Audit — Sankofa Rent

## What works ✅

- Viewport meta: `width=device-width, initial-scale=1, viewport-fit=cover` in `src/routes/__root.tsx`
- Bottom tab bar is a full-width bar (not floating pill), with 4 primary tabs + More drawer
- DataPage switches table→card layout at `md` (768 px) with accessible two-column info cards
- Forms open as Vaul bottom-sheet Drawers on mobile (`ResponsiveDialog`)
- Standardized 44 px (`h-11`) touch targets on action buttons and input controls
- Safe-area insets applied inline and via CSS custom properties in AppShell
- `pressable` utility with `:active` scale is defined in `styles.css`
- `overscroll-behavior-y: none` and `-webkit-tap-highlight-color: transparent` set globally

## Phase 0: Core Mobile Fixes ❌→✅

1. Global `box-sizing: border-box` and `overflow-x: hidden` on html/body to prevent horizontal spill
2. `whitespace-nowrap` + large GH₵ amounts in Dashboard KPI cards wrapped/scaled for 320 px viewports
3. Form grid stacking: converted tight `grid-cols-2` into responsive `grid-cols-1 sm:grid-cols-2` inside dialog drawers
4. iOS input zoom prevention: `text-base` minimum font size on mobile inputs and selects
5. Recharts chart overflow guard: `overflow-hidden` container preventing SVG overflow on narrow devices
6. CSS custom variables for safe-area insets (`--sat`, `--sab`, `--sal`, `--sar`) in `:root`
7. Platform detection hook (`usePlatform`) driving platform-specific styling (`data-platform="ios|android"`)
8. Top bar greeting ("Akwaaba, FirstName!") truncated gracefully on narrow viewports
9. `100dvh` replacing `100vh` to eliminate mobile browser navigation bar jump
10. Settings scrollable chip tab bar on mobile detail view
11. Page transition animations with `AnimatePresence` (150 ms ease-out fade + slide)
12. Native look & feel: iOS backdrop blur/translucency, Material 3 ripple and pill indicator

## Phase 1 & 2: Deep UI Inconsistencies & Polish ❌→✅

13. **Select vs Input Height Mismatch:** Unified `<SelectTrigger>` to `h-11 sm:h-9` and `text-base sm:text-sm` to perfectly match `<Input>`, ensuring uniform 44 px touch targets on mobile.
14. **Native OS Selects:** Replaced unstyled raw `<select>` tags in `properties.tsx` (unit editing) and `announcements.tsx` (property target) with theme-aware `SelectField` components.
15. **Form Label & Control Association:** Added missing `id` and `htmlFor` pairings in `SelectField`, `payments.tsx`, and `maintenance.tsx` for screen-reader and tap-to-focus accessibility.
16. **Form Alert Accessibility:** Added `role="alert"` to error feedback messages across all form dialogs (`FormDialog`, `payments.tsx`, `maintenance.tsx`, `invoices.tsx`).
17. **Submit Bar Spacing:** Normalized submit button bar margins from duplicated `mt-6` to consistent `pt-2 flex flex-col-reverse sm:flex-row` across all custom dialog forms.
18. **Table Action Button Accessibility & Feedback:** Added `pressable` micro-interactions and explicit `aria-label` tags with row context to action buttons in `tenants.tsx`, `leases.tsx`, `invoices.tsx`, `maintenance.tsx`, and `announcements.tsx`.
19. **Desktop Sidebar Tooltip Overflow:** Resolved hidden sidebar tooltip clipping by switching to clean, native browser `title` tooltips that render unconstrained.
20. **Mobile Drawer Safe-Area:** Enhanced the More drawer container with `pb-[calc(1rem+var(--sab,0px))]` for comfortable spacing above device home indicators.
21. **Badge Token Coverage:** Extended `Badge` tone mappings with `purple` and `blue` tokens to support user account badges cleanly.
22. **Multi-Admin Account Management Responsiveness:** Standardized the search header and "Add account" button (`w-full sm:w-auto`) with responsive action wrapping for dense user management rows.
