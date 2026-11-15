# Bug Investigation Plan — Sankofa Rent Application

**Investigation Date:** 2026-11-15  
**Workspace:** `c:\Users\NHANA_K_OTTO\Desktop\Final Y\rentwise-ghana`  
**Tech Stack:** TanStack Start + React 19 + Convex + Tailwind CSS v4 + Cloudflare Workers

---

## Executive Summary

This investigation plan covers a comprehensive bug sweep across the Sankofa Rent application. The app is a rent management system for Ghanaian landlords built with TanStack Router, React 19, Convex backend, and deployed to Cloudflare Workers. Based on initial code review, the following areas require systematic investigation:

### Known Issues from Initial Review

1. **Prettier/ESLint Issues**: 28 formatting errors in `DataPage.tsx` and `AppShell.tsx`
2. **React Fast Refresh Warnings**: Multiple component files export non-component values
3. **No TypeScript Type Checking Script**: Missing `typecheck` script in package.json

---

## 1. UI/Layout Issues Investigation

### 1.1 Dashboard Layout Issues

**Files to Check:**
- `src/routes/index.tsx` (lines 96-313: Dashboard component)
- `src/components/app/AppShell.tsx` (main layout wrapper)
- `src/styles.css` (global styles, responsive utilities)

**Specific Tests:**

#### Test 1.1.1: Recent Payments Section Cutoff
- **Location:** Dashboard, lines 260-279 in `index.tsx`
- **What to Check:**
  - Recent payments card has `min-h-[280px]` — verify if content exceeds this
  - Check if `slice(0, 4)` pagination cuts off visible items
  - Test with 0, 1, 4, 10+ payments
  - Verify scroll behavior when content overflows
  - Check mobile card layout (col-span-2 lg:col-span-2)

**Expected Behavior:** Card should show 4 payments max with "View all" link, or gracefully handle overflow with scroll.

#### Test 1.1.2: Maintenance Section Cutoff
- **Location:** Dashboard, lines 281-310 in `index.tsx`
- **What to Check:**
  - Maintenance card has `min-h-[280px]` and `col-span-2 sm:col-span-1`
  - Filter: `.filter((m) => m.status !== "resolved").slice(0, 3)`
  - Verify only 3 items show, check if more items cause overflow
  - Test empty state: "No open requests."
  - Check responsive behavior (2 cols on mobile, 1 col on sm+)

**Expected Behavior:** Shows up to 3 non-resolved maintenance requests, scrollable if needed.

#### Test 1.1.3: Dashboard Grid Layout
- **Location:** Dashboard root, line 96 `grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4`
- **What to Check:**
  - Verify all cards fit in viewport at breakpoints: mobile (2 col), lg (4 col)
  - Check for horizontal scroll on mobile
  - Test with different screen widths: 375px, 768px, 1024px, 1920px
  - Verify `min-h-[400px]` and `min-h-[280px]` cards don't create layout jumps

**Commands:**
```bash
# Start dev server
npm run dev

# Open in browser, inspect responsive behavior
# Check: http://localhost:3000/
# Use DevTools responsive mode: 375px, 768px, 1024px, 1920px
```

**What to Look For:**
- Cards cut off at bottom
- Horizontal scroll on mobile
- Overlapping content
- Missing scroll indicators
- Content overflow without scrollbars

---

### 1.2 Responsive Behavior

**Files to Check:**
- `src/hooks/use-mobile.tsx` (mobile detection)
- `src/components/app/DataPage.tsx` (responsive table/card views)
- All route files: `properties.tsx`, `tenants.tsx`, `payments.tsx`, `maintenance.tsx`

**Specific Tests:**

#### Test 1.2.1: Mobile Breakpoint Consistency
- **Location:** `use-mobile.tsx` defines breakpoint as 768px
- **What to Check:**
  - Verify all responsive classes use md: (768px) consistently
  - Check for hardcoded breakpoints or mismatched values
  - Test hook behavior on window resize
  - Verify SSR hydration doesn't cause layout shift

**Files to Grep:**
```bash
# Search for potential breakpoint mismatches
grep -r "sm:hidden md:block" src/
grep -r "lg:hidden" src/
grep -r "max-width.*768" src/
```

#### Test 1.2.2: DataPage Mobile/Desktop Views
- **Location:** `DataPage.tsx`, lines 69-130
- **What to Check:**
  - Mobile: Card view with stagger animation (md:hidden)
  - Desktop: Table view with overflow-x-auto (hidden md:block)
  - Test at exactly 768px width (boundary case)
  - Verify table horizontal scroll works with min-w-[720px]
  - Check mobile card layout with 1, 2, 10+ columns of data

**Commands:**
```bash
# Test each data page
# Navigate to: /properties, /tenants, /payments, /maintenance
# Resize: 375px, 767px, 768px, 1024px
```

**What to Look For:**
- Both mobile and desktop views showing simultaneously
- Table overflow breaking layout
- Missing horizontal scroll on narrow tables
- Card layout broken on mobile
- Touch target sizes < 44px on mobile

---

### 1.3 Overflow and Scroll Issues

**Files to Check:**
- `src/components/app/DataPage.tsx` (table overflow)
- `src/routes/index.tsx` (chart responsive container)
- `src/styles.css` (overflow utilities, hide-scrollbar)

**Specific Tests:**

#### Test 1.3.1: Table Horizontal Scroll
- **Location:** `DataPage.tsx`, line 105 `<div className="overflow-x-auto">`
- **What to Check:**
  - Table has `min-w-[720px]` — test on narrow screens
  - Verify scroll indicators visible
  - Check scroll works on touch devices
  - Test with long tenant names, addresses, reference numbers

#### Test 1.3.2: Chart Container
- **Location:** `index.tsx`, lines 180-215 (Rent collection chart)
- **What to Check:**
  - ResponsiveContainer inside `h-44 sm:h-48` with `overflow-hidden`
  - XAxis interval: `isMobile ? 1 : 0` — verify labels don't overlap
  - Test with 6 months of data (default) and edge cases (1 month, 12 months)
  - Verify recharts renders correctly on mobile

**Commands:**
```bash
# Open dashboard, resize to 375px width
# Inspect chart rendering
# Check browser console for recharts warnings
```

---

## 2. Functionality Bugs Investigation

### 2.1 Form Validation and Submission

**Files to Check:**
- `src/routes/properties.tsx` (Add property form)
- `src/routes/tenants.tsx` (Add/Edit tenant forms)
- `src/routes/payments.tsx` (Record payment form)
- `src/routes/maintenance.tsx` (Create maintenance request)
- `src/lib/format.ts` (validation helpers)

**Specific Tests:**

#### Test 2.1.1: Add Property Form
- **Location:** `properties.tsx`, lines 90-147
- **Test Cases:**
  - Submit with empty name → Should error
  - Add property with valid data → Should create in Convex
  - Add units (0, 1, 10+ units) → Verify all saved
  - Test unit rent validation (pesewasFromCedi)
  - Test duplicate property names

**Commands:**
```bash
# Navigate to /properties
# Click "Add property"
# Test validation by submitting empty/invalid data
# Check Convex dashboard for created records
```

#### Test 2.1.2: Record Payment Form
- **Location:** `payments.tsx`, lines 132-237
- **Test Cases:**
  - No tenant selected → Error: "Select a tenant."
  - Invalid amount → Error: "Enter a valid amount."
  - Amount parsing: "1,600", "GH₵ 1,600.00", "1600" → All should work
  - Optional invoice selection → Should work with/without
  - Payment method selection → All 5 methods available
  - Receipt number generation → Verify unique, sequential

**Edge Cases:**
- Negative amounts
- Zero amounts
- Very large amounts (>999,999)
- Special characters in reference field

#### Test 2.1.3: Maintenance Request Form
- **Location:** `maintenance.tsx`, lines 146-243
- **Test Cases:**
  - Property + unit selection cascade
  - Priority levels (low, medium, high) saved correctly
  - Optional description field
  - "Reported by" required validation
  - Empty state when no properties exist

---

### 2.2 Data Flow Verification

**Files to Check:**
- `convex/dashboard.ts` (summary calculations)
- `convex/payments.ts` (payment recording)
- `convex/tenants.ts` (tenant balance updates)
- `convex/invoices.ts` (invoice status updates)

**Specific Tests:**

#### Test 2.2.1: Payment Recording Flow
**Expected Flow:**
1. User records payment → `payments.record` mutation
2. Payment saved to `payments` table with receipt number
3. If invoice linked, invoice.paid updated, status recalculated
4. Tenant balance updated
5. Dashboard summary updated

**Test:**
```bash
# Record payment for a tenant with an invoice
# Check in Convex dashboard:
#   - payments table: new record with receiptNo
#   - invoices table: paid field updated
#   - tenants table: balance updated
#   - dashboard.summary: collectedThisMonth updated
```

#### Test 2.2.2: Tenant Balance Calculation
- **Location:** Tenant query returns `balance` field
- **What to Check:**
  - Balance = sum(invoices.amount - invoices.paid) for tenant
  - Negative balances not possible (overpayments)
  - Balance updates immediately after payment
  - Archive tenant → balance persists (not deleted)

#### Test 2.2.3: Dashboard Summary Calculations
- **Location:** `convex/dashboard.ts`
- **Metrics to Verify:**
  - `collectedThisMonth`: sum of payments in current UTC month
  - `expectedThisMonth`: sum of invoices due this month
  - `arrears`: sum of overdue invoice balances
  - `occupancyPercent`: (occupied units / total units) * 100
  - Collection rate: (collected / expected) * 100

**Test:**
```bash
# Create known test data:
#   - 2 properties, 4 units (2 occupied, 2 vacant) = 50% occupancy
#   - 1 invoice for GH₵ 1,000 due this month
#   - 1 payment for GH₵ 600 this month
# Expected: 
#   - occupancyPercent: 50
#   - expectedThisMonth: 100000 pesewas
#   - collectedThisMonth: 60000 pesewas
#   - Collection rate: 60%
```

---

### 2.3 Edit and Delete Actions

**Files to Check:**
- `src/routes/properties.tsx` (edit/archive property)
- `src/routes/tenants.tsx` (edit/archive tenant)
- `src/routes/maintenance.tsx` (update status)

**Specific Tests:**

#### Test 2.3.1: Edit Tenant
- **Location:** `tenants.tsx`, lines 104-114
- **Test Cases:**
  - Edit name, phone → Should update
  - Edit email, emergencyContact, ghanaCardNo → Optional fields work
  - Update unit assignment → Verify unit.tenantId updated
  - Unit dropdown shows current unit + vacant units

#### Test 2.3.2: Archive Actions
- **Test Tenant Archive:**
  - Archive tenant → tenant.archived = true
  - Archived tenant hidden from list
  - Verify payments/invoices persist (foreign keys)
  - Check if unit freed up (status → vacant)

- **Test Property Archive:**
  - Archive property → Verify units also archived
  - Check for orphaned tenants (tenants still linked to archived units)
  - Verify dashboard stats exclude archived properties

#### Test 2.3.3: Maintenance Status Updates
- **Location:** `maintenance.tsx`, lines 66-68, 112-113
- **Test Cases:**
  - Quick status toggle: open → in_progress → resolved → open
  - Edit dialog: Update status + add cost
  - Cost validation: Negative, decimal, empty values
  - Verify cost stored in pesewas (x100)

---

### 2.4 Maintenance Section Implementation

**Files to Check:**
- `src/routes/maintenance.tsx` (full implementation exists)
- `convex/maintenance.ts` (backend schema and queries)
- `src/routes/index.tsx` (dashboard widget, lines 281-310)

**What to Verify:**

#### Test 2.4.1: Maintenance is Fully Implemented
**Evidence from Code Review:**
- ✅ Full route at `/maintenance`
- ✅ DataPage with stats and table
- ✅ Create dialog with property/unit/priority selection
- ✅ Update dialog with status and cost fields
- ✅ Backend mutations: `create`, `updateStatus`
- ✅ Dashboard widget showing open requests

**Test:**
1. Navigate to `/maintenance`
2. Create new request → Should save
3. Update status open → in_progress → resolved
4. Add cost → Should save in pesewas
5. Verify dashboard shows up to 3 non-resolved requests
6. Check empty state: "No open requests."

**Potential Issues:**
- No "delete" or "archive" function (intentional?)
- No filtering by property/status in main view
- No attachments/photos support
- Dashboard link goes to `/maintenance` but may not filter

---

## 3. Data Display Issues Investigation

### 3.1 Formatting Verification

**Files to Check:**
- `src/lib/format.ts` (all formatting functions)

**Specific Tests:**

#### Test 3.1.1: Currency Formatting
- **Function:** `cediFromPesewas(pesewas: number): string`
- **Test Cases:**
  - 0 → "GH₵ 0.00"
  - 100 → "GH₵ 1.00"
  - 160000 → "GH₵ 1,600.00"
  - 999999999 → "GH₵ 9,999,999.99"
  - Negative values (should not occur, but test)

#### Test 3.1.2: Currency Parsing
- **Function:** `pesewasFromCedi(value: string): number`
- **Test Cases:**
  - "1600" → 160000
  - "1,600" → 160000
  - "GH₵ 1,600.00" → 160000
  - "GHS 1600" → 160000
  - "₵1,600.50" → 160050
  - "invalid" → NaN
  - "-100" → NaN (negatives rejected)
  - "" → NaN

**Commands:**
```typescript
// Test in browser console
import { pesewasFromCedi } from './src/lib/format';
console.log(pesewasFromCedi("1,600")); // Expected: 160000
console.log(pesewasFromCedi("GH₵ 1,600.00")); // Expected: 160000
```

#### Test 3.1.3: Date Formatting
- **Functions:** `formatDate`, `formatDateTime`, `msFromDateInput`
- **Test Cases:**
  - Dates render in UTC (no timezone shifts)
  - Month labels: "Jan 2026", "Dec 2025"
  - DateTime includes time: "15 Nov, 02:45"
  - Date input parsing: "2026-11-15" → correct epoch ms

**Edge Cases:**
- DST boundaries (Ghana has no DST, but test UTC consistency)
- Year boundaries (Dec 31 → Jan 1)
- Invalid dates → NaN handling

---

### 3.2 Empty States

**Files to Check:**
- All route components for empty state handling
- `src/components/app/DataPage.tsx`, lines 64-68

**Specific Tests:**

#### Test 3.2.1: DataPage Empty State
- **Location:** `DataPage.tsx`, lines 64-68
- **Message:** "Nothing here yet. Records you create will appear here."
- **Test:**
  - Fresh database: All pages show empty state
  - Delete all records: Empty state reappears
  - Visual design: Centered, clear message

#### Test 3.2.2: Dashboard Empty States
- **Locations:**
  - Recent payments: "No payments recorded yet." (line 269)
  - Maintenance: "No open requests." (line 292)
  - Announcements: "No announcements yet." (line 322)

**Test:**
- Fresh deployment → All empty states show
- Add one item → Empty state disappears
- Remove items → Empty state returns

#### Test 3.2.3: Select Dropdown Empty States
- **Locations:**
  - Tenant form: Unit selection when all units occupied
  - Payment form: Invoice selection when no unpaid invoices
  - Maintenance: Property selection when no properties

**Expected Behavior:**
- Graceful messaging: "No vacant units", "All invoices paid"
- Dropdowns disabled when no options
- Clear guidance to user

---

### 3.3 Edge Cases and Large Data

**Specific Tests:**

#### Test 3.3.1: Large Numbers
- **Test Cases:**
  - Property with 100+ units
  - Tenant with GH₵ 100,000+ arrears
  - Payment receipt numbers > 9999
  - Property name > 100 characters
  - Tenant name with special characters: "O'Connor", "Nkrumah-Acheampong"

**What to Check:**
- UI truncation with `truncate` class
- Number formatting with thousand separators
- Receipt number padding (R001 vs R10000)
- Text overflow handling

#### Test 3.3.2: No Data Scenarios
- **Test:**
  - New user with no properties → Dashboard shows 0s, empty charts
  - Tenant with no payments → Payment history empty
  - Property with no units → Cannot assign tenants
  - All invoices paid → No overdue badge

#### Test 3.3.3: Special Characters
- **Test Cases:**
  - Property name: "Nii's Compound", "Osu & Labadi Flats"
  - Tenant name: "Françoise Kouadio", "حسن محمد" (Arabic)
  - Unit label: "A/1", "Block B-3"
  - Payment reference: "MTN-20261115-#12345"

**What to Check:**
- Text renders correctly (UTF-8)
- No HTML injection
- Search/filter handles special chars
- Database saves and retrieves correctly

---

## 4. Console Errors & Runtime Issues Investigation

### 4.1 Browser Console Checks

**What to Check:**
- JavaScript errors
- React warnings
- Hydration mismatches
- Failed network requests
- Deprecation warnings

**Commands:**
```bash
# Start dev server
npm run dev

# Open browser DevTools (F12)
# Check Console tab for:
#   - Red errors
#   - Yellow warnings
#   - Network failures (XHR, Fetch)
```

**Specific Checks:**

#### Test 4.1.1: React Hydration Errors
- **Potential Issues:**
  - SSR mismatch: `useIsMobile` hook (line 5-22 in `use-mobile.tsx`)
  - Date formatting differences (server UTC vs client local)
  - Random data: avatars, colors (if any)

**What to Look For:**
```
Warning: Text content did not match. Server: "..." Client: "..."
Warning: Prop `className` did not match. Server: "..." Client: "..."
```

**Test:**
- Load each page, check for hydration warnings
- Test with React DevTools Profiler
- Verify server HTML matches client render

#### Test 4.1.2: Convex Query Errors
- **Potential Issues:**
  - Query returns undefined → Component crashes
  - Missing null checks
  - Failed authentication → 401 errors

**What to Look For:**
```
Convex query failed: ...
Cannot read property '...' of undefined
TypeError: properties is undefined
```

**Test:**
```bash
# Check Convex dashboard: https://dashboard.convex.dev/
# Verify queries return expected shape
# Test with network throttling (DevTools)
# Simulate auth failure
```

#### Test 4.1.3: Missing Dependencies Warnings
- **Potential Issues:**
  - `useEffect` missing deps
  - `useCallback` missing deps
  - `useMemo` missing deps

**Commands:**
```bash
npm run lint
# Look for: react-hooks/exhaustive-deps warnings
```

---

### 4.2 Network Request Verification

**Files to Check:**
- Browser DevTools Network tab
- Convex queries in `api.*` calls

**Specific Tests:**

#### Test 4.2.1: Failed API Calls
- **What to Check:**
  - All Convex queries return 200
  - No 400/401/403/500 errors
  - Mutations complete successfully
  - WebSocket connection stable (Convex realtime)

**Test:**
```bash
# Open DevTools Network tab
# Filter: XHR/Fetch
# Perform actions: create property, record payment, update tenant
# Verify all requests succeed (green status)
```

#### Test 4.2.2: Convex Realtime Subscription
- **What to Check:**
  - WebSocket connection established
  - Live updates work (open two tabs, edit in one, updates in other)
  - No reconnection loops
  - No subscription leaks

**Test:**
```bash
# Open app in two browser tabs
# Tab 1: Record a payment
# Tab 2: Should see payment appear immediately
# Check Network tab: ws:// connection stable
```

#### Test 4.2.3: Loading States
- **Location:** All route components check `!data` and show skeleton
- **Test:**
  - Slow network: Skeletons show, then data
  - Fast network: No flash of skeleton (if < 100ms)
  - Failed query: Error boundary catches

**Commands:**
```bash
# DevTools: Network > Throttling > Slow 3G
# Reload page, verify skeletons show
# Re-enable fast network, verify no layout shift
```

---

### 4.3 React DevTools Checks

**What to Check:**
- Component tree structure
- Props validation
- State updates
- Re-render causes

**Commands:**
```bash
# Install React DevTools extension
# Open browser, navigate to app
# DevTools > Components tab
```

**Specific Checks:**

#### Test 4.3.1: Unnecessary Re-renders
- **Use Profiler:**
  - Record interaction (e.g., open form dialog)
  - Check which components re-render
  - Look for unrelated components updating

**What to Look For:**
- Entire dashboard re-renders on dialog open (bad)
- Only dialog component mounts (good)
- Props changing unnecessarily (check with "Highlight updates")

#### Test 4.3.2: Props Type Validation
- **Check:**
  - All components receive correct prop types
  - No "Failed prop type" warnings
  - TypeScript types match runtime values

---

## 5. Code Quality Issues Investigation

### 5.1 TypeScript Errors

**Commands:**
```bash
# Manual type check (since script missing)
npx tsc --noEmit

# Check Convex types
cd convex
npx tsc --noEmit
```

**What to Check:**
- No `any` types (check with grep)
- All imports resolve
- No unused variables (with noUnusedLocals)
- Strict mode enabled

**Specific Checks:**

#### Test 5.1.1: TypeScript Configuration
- **File:** `tsconfig.json`
- **Verify:**
  - `"strict": true` ✅ (confirmed)
  - `"noUnusedLocals": false` ⚠️ (set to false, intentional?)
  - `"noUnusedParameters": false` ⚠️
  - `"exactOptionalPropertyTypes": false` ✅ (Convex requirement)

#### Test 5.1.2: Convex Types
- **Files:** `convex/_generated/dataModel.ts`, `convex/_generated/api.ts`
- **Verify:**
  - Types generated correctly
  - All queries/mutations have correct signatures
  - `Doc<"table">` types match schema

**Commands:**
```bash
# Regenerate Convex types
npx convex dev --once --env-file .env.local
```

#### Test 5.1.3: Import Errors
- **Check:**
  - All `@/` paths resolve (tsconfig paths)
  - No circular dependencies
  - No duplicate imports

**Commands:**
```bash
# Search for potential issues
grep -r "import.*from.*'\.\./" src/
grep -r "import.*import" src/
```

---

### 5.2 ESLint and Prettier Issues

**Current Known Issues from Lint Output:**
1. **AppShell.tsx:**
   - Line 456: Prettier formatting (spacing)
   - Line 520: Prettier formatting (line break)
   - Line 631: Fast refresh warning (exports non-component)

2. **DataPage.tsx:**
   - Lines 105-129: 25 prettier formatting errors (indentation)

3. **Component Files:**
   - `badge.tsx`, `button.tsx`, `form.tsx`, `navigation-menu.tsx`, `sidebar.tsx`
   - Warning: Export non-component values (affects Fast Refresh)

**Commands:**
```bash
# Auto-fix formatting
npm run format

# Re-run lint
npm run lint

# Verify fixes
git diff src/
```

**What to Check After Fix:**
- All 28 prettier errors resolved
- Fast refresh warnings (may need refactor to separate files)
- No new errors introduced

---

### 5.3 Unused Imports and Dead Code

**Commands:**
```bash
# Search for unused imports (TypeScript will flag these)
npx tsc --noEmit 2>&1 | grep "is declared but"

# Search for potential dead code
grep -r "function.*{$" src/ | wc -l  # Count functions
grep -r "export function" src/ | wc -l  # Count exports
```

**Specific Checks:**

#### Test 5.3.1: Unused Components
- **Check:**
  - UI components imported but not used
  - Helper functions defined but never called
  - Types defined but not referenced

#### Test 5.3.2: Commented Code
**Commands:**
```bash
# Search for commented code blocks
grep -r "// function" src/
grep -r "// const" src/
grep -r "/\* " src/
```

**What to Do:**
- Remove dead code
- Document why code is commented (if intentional)

---

### 5.4 Component Props and Types

**Files to Check:**
- All component files in `src/components/`
- Route components in `src/routes/`

**Specific Checks:**

#### Test 5.4.1: Missing Prop Types
- **Check:**
  - All components have explicit prop interfaces/types
  - No implicit `any` props
  - Optional props marked with `?`
  - Required props enforced

**Example:**
```typescript
// Bad
function MyComponent(props) { ... }

// Good
interface MyComponentProps {
  title: string;
  onClose?: () => void;
}
function MyComponent({ title, onClose }: MyComponentProps) { ... }
```

#### Test 5.4.2: Prop Validation in Forms
- **Check:**
  - All form inputs have proper types
  - Email inputs: `type="email"`
  - Tel inputs: `type="tel"`
  - Number inputs: `inputMode="decimal"` for currency
  - All inputs have labels (accessibility)

**Files to Check:**
- `FormDialog.tsx` (shared form components)
- All form dialogs in route files

---

### 5.5 Accessibility (WCAG Compliance)

**Tools:**
```bash
# Install axe DevTools extension
# Or use Lighthouse in Chrome DevTools
```

**Specific Checks:**

#### Test 5.5.1: Form Labels
- **Check:**
  - All inputs have associated `<Label>` with `htmlFor`
  - All buttons have accessible text or `aria-label`
  - All icons have `aria-hidden` or `title`

**Files to Check:**
- `AuthLayout.tsx`: Field component (lines 51-90)
- All form dialogs

#### Test 5.5.2: Color Contrast
- **Check:**
  - Text on backgrounds meets WCAG AA (4.5:1)
  - Muted text meets minimum contrast
  - Disabled states have sufficient contrast

**Test:**
```bash
# Use Lighthouse Accessibility audit
# Chrome DevTools > Lighthouse > Accessibility
```

#### Test 5.5.3: Keyboard Navigation
- **Test:**
  - Tab through all interactive elements
  - Focus visible on all focusable elements
  - Modal traps focus (can't tab outside)
  - Esc key closes dialogs

**What to Check:**
- `:focus` styles visible (check `styles.css`)
- All buttons/links reachable by keyboard
- Form submission via Enter key
- Dialog close via Escape key

#### Test 5.5.4: Screen Reader Compatibility
- **Check:**
  - Images have `alt` text
  - Icons have `aria-label` or are `aria-hidden`
  - Loading skeletons have `aria-busy` or `aria-live`
  - Error messages have `role="alert"`

**Files to Check:**
- `AuthLayout.tsx`: AuthNotice has `role={error ? "alert" : "status"}` ✅
- All images: `courtyard` image in AuthLayout
- All icon buttons: Pencil, Archive, Eye icons

---

## 6. Authentication & Authorization Investigation

### 6.1 Auth Flow Verification

**Files to Check:**
- `src/routes/login.tsx`
- `src/routes/signup.tsx`
- `src/routes/forgot-password.tsx`
- `convex/auth.config.ts`
- `convex/auth.ts`

**Specific Tests:**

#### Test 6.1.1: Login Flow
- **Test Cases:**
  - Valid email + password → Redirect to dashboard
  - Invalid credentials → Error: "Invalid email or password"
  - Empty fields → Client-side validation errors
  - Server error → Friendly error message (via `friendlyError`)

**Commands:**
```bash
# Navigate to /login
# Test with valid user: (create via signup first)
# Test with invalid: wrong@example.com / wrongpass
# Check redirect after login: Should go to /
```

#### Test 6.1.2: Signup Flow
- **Test Cases:**
  - Valid data → Account created, redirect to dashboard
  - Duplicate email → Error: "Email already registered"
  - Weak password → Validation error
  - First user → Becomes admin (check role)

**Commands:**
```bash
# Navigate to /signup
# Create first user: test@example.com / password123
# Check Convex dashboard: profiles table, role = "admin"
# Create second user: user@example.com / password123
# Check role: Should be "user"
```

#### Test 6.1.3: Forgot Password Flow
- **Test:**
  - Page exists and renders
  - Form submits (check if implemented or placeholder)
  - Email sent (if email service configured)

**Note:** Password reset may not be fully implemented — verify in code.

---

### 6.2 Protected Routes

**Files to Check:**
- `src/routes/__root.tsx` (auth check)
- All route files (authentication guard)

**Specific Tests:**

#### Test 6.2.1: Unauthenticated Access
- **Test:**
  - Log out
  - Navigate to `/properties` → Should redirect to `/login`
  - Navigate to `/tenants` → Should redirect to `/login`
  - Navigate to `/payments` → Should redirect to `/login`

**Expected Behavior:**
- All routes except `/login`, `/signup`, `/forgot-password` require auth
- Redirect to `/login` with return URL
- After login, redirect back to original URL

#### Test 6.2.2: Session Persistence
- **Test:**
  - Log in
  - Refresh page → Should stay logged in
  - Close tab, reopen → Should stay logged in
  - Clear cookies → Should log out

**Check:**
- Convex session stored in cookie
- Cookie has proper `httpOnly`, `secure` flags
- Session expiry handled gracefully

---

### 6.3 Admin-Only Features

**Files to Check:**
- `convex/branding.ts` (admin check: `requireAdmin`)
- `src/routes/settings.tsx` (Branding tab)
- UI guards (Settings > Branding tab visible only to admins)

**Specific Tests:**

#### Test 6.3.1: Branding Tab Access
- **Test:**
  - Log in as admin → Branding tab visible
  - Log in as user → Branding tab hidden
  - User tries `settings.updateBranding` mutation → Should error

**Commands:**
```bash
# Create admin user (first user)
# Log in, go to /settings?tab=branding
# Verify tab shows, form works

# Create regular user
# Log in, go to /settings?tab=branding
# Verify tab hidden or shows "Admin only" message
```

#### Test 6.3.2: Server-Side Admin Check
- **Location:** `convex/branding.ts`, `requireAdmin` helper
- **Test:**
  - Call `branding.update` as user via Convex dashboard
  - Should throw: "Admin access required"

**Commands:**
```bash
# Convex dashboard: Run function manually
# Function: branding:update
# User: non-admin
# Expected: Error thrown
```

---

### 6.4 Logout Flow

**Files to Check:**
- Logout button location (in AppShell or Settings)
- Auth cleanup

**Specific Tests:**

#### Test 6.4.1: Logout Action
- **Test:**
  - Click logout → Redirect to `/login`
  - Session cleared
  - Cannot access protected routes
  - Login required to access app again

**Check:**
- Logout button accessible
- No console errors on logout
- Convex session terminated

---

## 7. Build and Deployment Verification

### 7.1 Build Process

**Commands:**
```bash
# Production build
npm run build

# Check for build errors
# Verify output in .output/ or dist/

# Development build
npm run build:dev
```

**What to Check:**
- Build succeeds without errors
- No TypeScript errors (should fail build if strict)
- No missing modules
- Output bundle size reasonable
- Source maps generated

**Specific Checks:**

#### Test 7.1.1: Build Output
- **Check:**
  - Build time: < 60 seconds (acceptable for dev)
  - Bundle size: < 2MB (with code splitting)
  - No warnings about missing files
  - Worker script generated for Cloudflare

#### Test 7.1.2: Environment Variables
- **Files:** `.env.local`, `.env.production`, `.env.production.local`
- **Check:**
  - `VITE_CONVEX_URL` set correctly
  - Dev URL: points to `dev:adorable-pig-437`
  - Prod URL: points to `prod:usable-penguin-827`
  - Public variables prefixed with `VITE_`

**Commands:**
```bash
# Verify env files exist
ls -la .env.*

# Check build reads correct env
npm run build:dev  # Should use dev Convex URL
npm run build      # Should use prod Convex URL
```

---

### 7.2 Deployment Verification

**Deployment Target:** Cloudflare Workers  
**Deployed URL:** https://final-year-rent-project.edimamfaidol.workers.dev  
**Deployment Method:** Workers Builds on push to `main`

**Specific Checks:**

#### Test 7.2.1: Manual Deployment
- **Commands:**
```bash
# Manual deploy (emergency only)
npm run build
npx wrangler deploy
```

**What to Check:**
- `wrangler.jsonc` configured correctly
- Worker name: `final-year-rent-project`
- Compatibility date set
- Routes configured (if any)

#### Test 7.2.2: Live Site Verification
- **Test:**
  - Navigate to: https://final-year-rent-project.edimamfaidol.workers.dev
  - App loads without errors
  - Login works
  - Convex connects to prod deployment
  - All features functional

**Check:**
- No mixed content warnings (HTTPS)
- API calls go to prod Convex URL
- No CORS errors
- Assets load correctly

#### Test 7.2.3: Git-Connected Build
- **Test:**
  - Push to `main` branch
  - Workers Builds triggers
  - Deployment succeeds
  - Live site updates

**Commands:**
```bash
# Make a trivial change
echo "# Test" >> README.md
git add README.md
git commit -m "Test deployment"
git push origin main

# Check Workers dashboard:
# https://dash.cloudflare.com/
# Verify build triggered and succeeded
```

---

## 8. Testing Commands Summary

### Build and Test Commands
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Development build
npm run build:dev

# Preview production build
npm run preview

# Lint
npm run lint

# Format (auto-fix)
npm run format

# Run tests (if any)
npm test

# Manual TypeScript check (no script)
npx tsc --noEmit

# Convex dev (start backend)
npx convex dev --env-file .env.local

# Convex deploy (production)
npx convex deploy --env-file .env.production.local

# Wrangler deploy (Cloudflare Workers)
npx wrangler deploy
```

### Browser Testing
```bash
# Start dev server
npm run dev

# Open browser: http://localhost:3000
# Test viewports: 375px, 768px, 1024px, 1920px
# Check DevTools Console for errors
# Check Network tab for failed requests
```

### Database Inspection
```bash
# Convex dashboard
# Dev: https://dashboard.convex.dev/t/adorable-pig-437
# Prod: https://dashboard.convex.dev/t/usable-penguin-827

# Check tables:
#   - profiles (users and roles)
#   - properties, units
#   - tenants (with balance calculation)
#   - invoices, payments
#   - maintenance
#   - announcements
#   - branding
```

---

## 9. Expected Outcomes

### Bug Categories

#### Critical Bugs (Block usage)
- [ ] App crashes on load
- [ ] Authentication broken
- [ ] Cannot create/edit/delete records
- [ ] Data loss on save
- [ ] Build fails

#### High Priority Bugs (Major functionality)
- [ ] Dashboard layout broken on mobile
- [ ] Payments not calculating correctly
- [ ] Forms validation bypassed
- [ ] Admin features accessible to users
- [ ] Console errors on every page

#### Medium Priority Bugs (Degraded UX)
- [ ] Recent payments section cut off
- [ ] Maintenance section cut off
- [ ] Responsive layout issues
- [ ] Slow loading states
- [ ] Missing empty states

#### Low Priority Bugs (Polish)
- [ ] Prettier formatting errors
- [ ] Missing TypeScript types
- [ ] Accessibility improvements
- [ ] Color contrast issues
- [ ] Animation glitches

---

## 10. Investigation Workflow

### Phase 1: Static Analysis (No server needed)
1. Run `npm run lint` → Fix all prettier/eslint errors
2. Run `npx tsc --noEmit` → Fix TypeScript errors
3. Review code for patterns:
   - Unused imports
   - Dead code
   - Missing prop types
   - Accessibility attributes

**Deliverable:** List of code quality fixes needed

---

### Phase 2: Local Development Testing
1. Start servers:
   ```bash
   npm run dev
   npx convex dev --env-file .env.local
   ```

2. Test each route:
   - `/` (Dashboard)
   - `/properties`
   - `/tenants`
   - `/payments`
   - `/maintenance`
   - `/invoices`
   - `/leases`
   - `/announcements`
   - `/settings`

3. For each route:
   - Check browser console (errors/warnings)
   - Test responsive behavior (375px, 768px, 1024px)
   - Verify loading states
   - Test empty states (fresh DB)
   - Test with data (populated DB)
   - Test forms (validation, submission)
   - Test edit/delete actions

**Deliverable:** List of functional bugs by route

---

### Phase 3: Data Flow Testing
1. Create test data:
   - 2 properties (4 units: 2 occupied, 2 vacant)
   - 2 tenants (assigned to units)
   - 2 invoices (1 paid, 1 overdue)
   - 2 payments (linked to invoices)
   - 2 maintenance requests (1 open, 1 resolved)

2. Verify calculations:
   - Dashboard summary (occupancy, collection rate, arrears)
   - Tenant balances
   - Invoice statuses
   - Payment receipts sequential

3. Test edge cases:
   - Archive tenant → Unit freed
   - Overpayment on invoice
   - Delete property with tenants
   - Create payment before invoice

**Deliverable:** List of data integrity bugs

---

### Phase 4: Browser Compatibility
1. Test in browsers:
   - Chrome (desktop + mobile)
   - Firefox (desktop)
   - Safari (desktop + iOS)
   - Edge (desktop)

2. Check for:
   - Layout differences
   - JavaScript errors
   - CSS rendering issues
   - Touch target sizes on mobile

**Deliverable:** List of browser-specific bugs

---

### Phase 5: Accessibility Audit
1. Run Lighthouse:
   ```bash
   # Chrome DevTools > Lighthouse > Accessibility
   ```

2. Manual keyboard testing:
   - Tab through all pages
   - Verify focus visible
   - Test modal focus trap
   - Test Esc key on dialogs

3. Screen reader testing (optional):
   - NVDA (Windows)
   - VoiceOver (macOS/iOS)

**Deliverable:** List of accessibility violations

---

### Phase 6: Production Verification
1. Check live site: https://final-year-rent-project.edimamfaidol.workers.dev
2. Verify:
   - App loads
   - Convex connects
   - Login works
   - No console errors
   - All features functional

3. Compare to local:
   - Same behavior
   - Same performance
   - Same UI

**Deliverable:** Production deployment status

---

## 11. Bug Report Template

For each bug found, document using this template:

```markdown
### Bug #[Number]: [Title]

**Severity:** Critical | High | Medium | Low
**Category:** UI/Layout | Functionality | Data Display | Console Error | Code Quality | Auth

**Location:**
- File: `src/routes/index.tsx`
- Lines: 260-279
- Component: Recent payments card

**Description:**
The "Recent payments" section on the dashboard is cut off at the bottom on smaller screens. The card has `min-h-[280px]` but content exceeds this when showing 4 payments with long tenant names.

**Steps to Reproduce:**
1. Navigate to `/`
2. Ensure 4+ payments exist
3. Resize window to 768px width
4. Observe bottom payment is cut off

**Expected Behavior:**
Card should either:
- Increase min-height dynamically
- Add scrolling with visible indicator
- Limit to 3 items instead of 4

**Actual Behavior:**
Last payment is partially visible, no scroll indicator.

**Screenshots:**
[Attach screenshot]

**Console Output:**
None

**Suggested Fix:**
Change `min-h-[280px]` to `min-h-fit` or add `overflow-y-auto` with `max-h-[400px]`.

**Priority Justification:**
Medium — Affects UX on common screen sizes but doesn't block core functionality.
```

---

## 12. Next Steps After Investigation

1. **Prioritize bugs**: Critical → High → Medium → Low
2. **Create implementation plan**: Step-by-step fixes
3. **Estimate effort**: Hours per bug
4. **Group related fixes**: Layout issues together, form validation together, etc.
5. **Test after each fix**: Regression testing
6. **Deploy incrementally**: Don't fix everything at once

---

## Investigation Checklist

### Pre-Investigation
- [x] Read AGENTS.md for project context
- [x] Review package.json for scripts and dependencies
- [x] Check tsconfig.json for TypeScript settings
- [x] Identify all route files
- [x] Map Convex backend files
- [x] Review component structure

### Static Analysis
- [ ] Run `npm run lint` and document errors
- [ ] Run `npx tsc --noEmit` and document errors
- [ ] Check for console.* statements
- [ ] Check for TODO/FIXME comments
- [ ] Review accessibility attributes

### Runtime Testing
- [ ] Test all routes at 375px, 768px, 1024px
- [ ] Test all forms (validation + submission)
- [ ] Test all edit/delete actions
- [ ] Check browser console on every page
- [ ] Verify Convex queries in Network tab
- [ ] Test with empty database
- [ ] Test with populated database
- [ ] Test edge cases (large data, special chars)

### Calculation Verification
- [ ] Dashboard summary calculations
- [ ] Tenant balance calculations
- [ ] Invoice status updates
- [ ] Payment receipt numbering
- [ ] Occupancy percentage
- [ ] Collection rate percentage

### Authentication
- [ ] Login flow (valid + invalid)
- [ ] Signup flow (first user = admin)
- [ ] Protected routes (redirect to login)
- [ ] Admin-only features (Branding tab)
- [ ] Logout flow
- [ ] Session persistence

### Build & Deploy
- [ ] `npm run build` succeeds
- [ ] `npm run build:dev` succeeds
- [ ] Live site functional
- [ ] Correct Convex URL in prod
- [ ] No CORS errors
- [ ] Workers Builds triggers on push

### Final Report
- [ ] List all bugs found
- [ ] Categorize by severity
- [ ] Document reproduction steps
- [ ] Suggest fixes
- [ ] Estimate effort
- [ ] Create implementation plan

---

## Notes

- Investigation should take **4-6 hours** for thorough coverage
- Focus on **user-facing bugs** first (UI, functionality)
- Code quality issues are **lowest priority** unless blocking
- Document **everything** — even if not a bug, note that it was checked
- Take **screenshots** of visual bugs
- Record **console output** for runtime errors
- **Test incrementally** — don't wait until the end to verify

---

## Appendix: File Structure Reference

```
rentwise-ghana/
├── src/
│   ├── routes/
│   │   ├── index.tsx (Dashboard) ⭐
│   │   ├── properties.tsx
│   │   ├── tenants.tsx
│   │   ├── payments.tsx ⭐
│   │   ├── maintenance.tsx ⭐
│   │   ├── invoices.tsx
│   │   ├── leases.tsx
│   │   ├── announcements.tsx
│   │   ├── settings.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── forgot-password.tsx
│   │   └── __root.tsx
│   ├── components/
│   │   ├── app/
│   │   │   ├── AppShell.tsx ⚠️ (lint errors)
│   │   │   ├── DataPage.tsx ⚠️ (lint errors)
│   │   │   ├── FormDialog.tsx
│   │   │   └── ResponsiveDialog.tsx
│   │   ├── auth/
│   │   │   └── AuthLayout.tsx
│   │   └── ui/ (shadcn components)
│   ├── lib/
│   │   ├── format.ts ⭐ (currency, dates)
│   │   └── branding.tsx
│   ├── hooks/
│   │   └── use-mobile.tsx ⚠️ (hydration risk)
│   └── styles.css
├── convex/
│   ├── dashboard.ts ⭐ (summary calculations)
│   ├── payments.ts ⭐
│   ├── tenants.ts
│   ├── properties.ts
│   ├── maintenance.ts
│   ├── invoices.ts
│   ├── branding.ts (admin only)
│   ├── auth.config.ts
│   └── schema.ts
├── .env.local (dev: adorable-pig-437)
├── .env.production.local (prod: usable-penguin-827)
├── package.json
├── tsconfig.json
└── wrangler.jsonc

⭐ = High priority for investigation
⚠️ = Known issues from initial review
```

---

**End of Investigation Plan**

Path: `c:\Users\NHANA_K_OTTO\Desktop\Final Y\rentwise-ghana\.agents\tasks\bug-sweep\investigation-plan.md`
