import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import {
  LayoutGrid,
  Building2,
  Users,
  FileSignature,
  Receipt,
  Wallet,
  Wrench,
  Megaphone,
  Settings,
  LogOut,
  Bell,
  MoreHorizontal,
  ChevronLeft,
  Sun,
  Moon,
  User,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useBranding } from "@/lib/branding";
import { initials } from "@/lib/format";
import { usePlatform } from "@/hooks/use-platform";
import { hapticTap } from "@/lib/haptics";
import { useRipple } from "@/hooks/use-ripple";
import { useTheme } from "@/hooks/use-theme";
import {
  MustChangePasswordModal,
  TemporaryPasswordBanner,
} from "@/components/auth/MustChangePasswordModal";

// ─── Navigation config ───────────────────────────────────────────────────────

const PRIMARY_TABS = [
  { to: "/", label: "Home", icon: LayoutGrid },
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/tenants", label: "Tenants", icon: Users },
  { to: "/payments", label: "Payments", icon: Wallet },
] as const;

const MORE_ITEMS = [
  { to: "/leases", label: "Leases", icon: FileSignature },
  { to: "/invoices", label: "Invoices", icon: Receipt },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const DESKTOP_NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/properties", label: "Properties & units", icon: Building2 },
  { to: "/tenants", label: "Tenants", icon: Users },
  { to: "/leases", label: "Leases", icon: FileSignature },
  { to: "/invoices", label: "Rent invoices", icon: Receipt },
  { to: "/payments", label: "Payments & receipts", icon: Wallet },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
] as const;

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/properties": "Properties",
  "/tenants": "Tenants",
  "/leases": "Leases",
  "/invoices": "Invoices",
  "/payments": "Payments",
  "/maintenance": "Maintenance",
  "/announcements": "Announcements",
  "/settings": "Settings",
};

const TOP_LEVEL = new Set(["/", "/properties", "/tenants", "/payments"]);

// ─── Mobile top bar ──────────────────────────────────────────────────────────

function MobileTopBar({
  path,
  avatar,
  onToggleTheme,
  isDark,
}: {
  path: string;
  avatar: string;
  onToggleTheme: () => void;
  isDark: boolean;
}) {
  const router = useRouter();
  const platform = usePlatform();
  const [scrolled, setScrolled] = useState(false);
  const isTop = TOP_LEVEL.has(path);
  const title = PAGE_TITLES[path] ?? "Sankofa Rent";
  const { logoUrl } = useBranding();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`mobile-top-bar sm:hidden fixed inset-x-0 top-0 z-40 transition-shadow duration-200 ${scrolled ? "shadow-sm" : ""}`}
      style={{ paddingTop: "var(--sat)" }}
    >
      <div
        className={`h-14 flex items-center px-2 sm:px-3 gap-0.5 backdrop-blur-xl ${scrolled ? "bg-background/90 border-b border-border/60" : "bg-transparent"}`}
      >
        {/* Left slot — narrow enough that the page title still fits at 320px */}
        <div className="flex w-11 shrink-0 items-center justify-start">
          {isTop ? (
            <div className="grid h-9 w-9 place-items-center text-primary">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-7 w-7 rounded-lg object-contain"
                  width={28}
                  height={28}
                />
              ) : (
                <Sun className="h-7 w-7" strokeWidth={2.5} />
              )}
            </div>
          ) : (
            <button
              onClick={() => router.history.back()}
              aria-label="Go back"
              className="grid h-11 w-11 place-items-center rounded-full text-foreground pressable hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Centre slot — iOS: centred, Android/other: left-aligned */}
        <div className={`flex-1 min-w-0 ${platform === "ios" ? "text-center" : "text-left pl-1"}`}>
          <h1 className="truncate text-[17px] font-semibold leading-none tracking-tight">
            {title}
          </h1>
        </div>

        {/* Right slot */}
        <div className="flex w-auto items-center gap-0.5">
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="grid h-11 w-11 place-items-center rounded-full text-foreground pressable hover:bg-muted"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link
            to="/announcements"
            aria-label="Announcements"
            className="grid h-11 w-11 place-items-center rounded-full text-foreground pressable hover:bg-muted"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <Link to="/settings" aria-label="Settings" className="pressable">
            <AvatarCircle
              initials={avatar}
              className="h-10 w-10 text-[11px] ring-2 ring-transparent hover:ring-border"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Bottom tab bar ──────────────────────────────────────────────────────────

function BottomTabBar({
  path,
  onLogout,
  profile,
  pendingResetCount,
}: {
  path: string;
  onLogout: () => void | Promise<void>;
  profile:
    | { firstName?: string | null; lastName?: string | null; businessName?: string | null }
    | null
    | undefined;
  pendingResetCount?: number;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const platform = usePlatform();
  const ripple = useRipple();

  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
  const moreActive = MORE_ITEMS.some((m) => path.startsWith(m.to));
  const activeTabIndex = PRIMARY_TABS.findIndex((t) => isActive(t.to));

  const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  const avatarInitials = initials(fullName);

  function onTabPress() {
    hapticTap();
    setMoreOpen(false);
  }

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="mobile-tab-bar sm:hidden fixed inset-x-0 bottom-0 z-40"
        style={{ paddingBottom: "var(--sab)" }}
      >
        <div className="relative mx-auto grid h-[3.75rem] max-w-lg grid-cols-5">
          {/* Android M3 active pill indicator */}
          {platform === "android" && activeTabIndex >= 0 && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 h-8 w-16 rounded-full bg-primary/15 pointer-events-none"
              style={{ left: `calc(${activeTabIndex} * 20% + 10% - 2rem)` }}
              layoutId="tab-pill"
              transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
            />
          )}

          {PRIMARY_TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={isActive(tab.to) ? "page" : undefined}
              onClick={onTabPress}
              onMouseDown={ripple}
              className={`ripple relative flex flex-col items-center justify-center gap-0.5 pressable ${
                isActive(tab.to) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon
                className="h-[22px] w-[22px]"
                strokeWidth={isActive(tab.to) ? 2.3 : 1.7}
                fill={isActive(tab.to) && platform === "ios" ? "currentColor" : "none"}
              />
              <span className="text-[10px] font-semibold leading-none tracking-tight">
                {tab.label}
              </span>
              {/* iOS active underline dot */}
              {isActive(tab.to) && platform === "ios" && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
          ))}

          {/* More button */}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              setMoreOpen(true);
            }}
            onMouseDown={ripple}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            aria-label="More sections"
            className={`ripple relative flex flex-col items-center justify-center gap-0.5 pressable ${
              moreActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div className="relative">
              <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={moreActive ? 2.3 : 1.7} />
              {(pendingResetCount ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-amber-500" />
              )}
            </div>
            <span className="text-[10px] font-semibold leading-none tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* More drawer — bottom sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 sm:hidden"
              onClick={() => setMoreOpen(false)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="More navigation"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-card sm:hidden flex flex-col max-h-[90dvh]"
              style={{ paddingBottom: "calc(var(--sab) + 1.25rem)" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              </div>

              {/* User info */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border/60 shrink-0">
                <AvatarCircle initials={avatarInitials} className="h-10 w-10 text-sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{fullName || "Account"}</p>
                  {profile?.businessName && (
                    <p className="truncate text-xs text-muted-foreground">{profile.businessName}</p>
                  )}
                </div>
                <button
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close menu"
                  className="ml-auto grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted pressable"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 pb-[calc(1rem+var(--sab,0px))]">
                {/* Navigation items */}
                <div className="grid grid-cols-3 gap-2 p-4 min-[380px]:grid-cols-4">
                  {MORE_ITEMS.filter((m) => m.to !== "/settings").map((m) => (
                    <Link
                      key={m.to}
                      to={m.to}
                      onClick={() => {
                        hapticTap();
                        setMoreOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted px-2 py-4 pressable ${
                        path.startsWith(m.to) ? "bg-primary-soft text-primary" : ""
                      }`}
                    >
                      <m.icon className="h-5 w-5" strokeWidth={path.startsWith(m.to) ? 2.2 : 1.8} />
                      <span className="text-center text-[11px] font-semibold leading-tight">
                        {m.label}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Settings + Sign out */}
                <div className="mx-4 overflow-hidden rounded-2xl bg-muted divide-y divide-border/70">
                  <Link
                    to="/settings"
                    onClick={() => {
                      hapticTap();
                      setMoreOpen(false);
                    }}
                    className="flex min-h-[52px] items-center gap-3 px-4 text-sm font-semibold pressable hover:bg-muted/80"
                  >
                    <Settings className="h-5 w-5 text-primary" />
                    <span className="flex-1">Settings</span>
                    {(pendingResetCount ?? 0) > 0 && (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {pendingResetCount} reset request{pendingResetCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onLogout();
                    }}
                    className="flex min-h-[52px] w-full items-center gap-3 px-4 text-sm font-semibold text-destructive pressable hover:bg-muted/80"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </div>
                <p className="mt-3 mb-2 text-center text-[11px] text-muted-foreground">
                  Sankofa Rent {"\u00B7"} v1.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── App shell ───────────────────────────────────────────────────────────────

const NAV_KEY = "sankofa-nav-expanded";

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const profile = useQuery(api.profiles.me, isAuthenticated ? {} : "skip");
  const isAdmin = profile?.role === "admin";
  const pendingResetCount = useQuery(api.passwordReset.countPending, isAdmin ? {} : "skip");
  const { logoUrl } = useBranding();
  const platform = usePlatform();
  const { toggle: toggleTheme, effective: effectiveTheme } = useTheme();

  const [mustChangePwModalOpen, setMustChangePwModalOpen] = useState(false);

  useEffect(() => {
    if (profile?.mustChangePassword) {
      setMustChangePwModalOpen(true);
    }
  }, [profile?.mustChangePassword]);

  // Rail can expand to show section labels. Persisted, and SSR-safe: the
  // initial value comes from localStorage when there is one.
  const [navExpanded, setNavExpanded] = useState<boolean>(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(NAV_KEY) === "1";
  });

  useEffect(() => {
    try {
      localStorage.setItem(NAV_KEY, navExpanded ? "1" : "0");
    } catch {
      // storage can be unavailable (private mode); expansion just won't persist
    }
  }, [navExpanded]);

  // Keyboard offset for mobile: shrink main when soft keyboard opens
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      document.documentElement.style.setProperty("--keyboard-offset", `${Math.max(0, offset)}px`);
    };
    vv.addEventListener("resize", handler);
    vv.addEventListener("scroll", handler);
    return () => {
      vv.removeEventListener("resize", handler);
      vv.removeEventListener("scroll", handler);
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  async function logout() {
    await signOut();
    window.location.assign("/login");
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background">
        {/* Animated logo placeholder */}
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary animate-pulse">
          <Sun className="h-6 w-6" strokeWidth={2} />
        </div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const profileReady = profile !== undefined;
  const firstName = profile?.firstName ?? "";
  const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  const avatar = profileReady ? initials(fullName) : "";

  // platform is used for the data-platform attribute set by usePlatform hook
  void platform;

  return (
    <div className="min-h-dvh sm:h-dvh sm:overflow-hidden sm:flex sm:flex-col">
      {/* Mobile top bar */}
      <MobileTopBar
        path={path}
        avatar={avatar}
        onToggleTheme={toggleTheme}
        isDark={effectiveTheme === "dark"}
      />

      {/* Desktop header */}
      <header className="hidden sm:block sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl pt-safe">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center text-primary">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-9 w-9 rounded-lg object-contain"
                  width={36}
                  height={36}
                />
              ) : (
                <Sun className="h-9 w-9" strokeWidth={2.5} />
              )}
            </div>
            <div className="min-w-0">
              {profileReady ? (
                <h1 className="truncate text-lg font-semibold leading-tight">
                  {path === "/"
                    ? firstName
                      ? `Akwaaba, ${firstName}!`
                      : "Akwaaba!"
                    : (PAGE_TITLES[path] ?? "Sankofa Rent")}
                </h1>
              ) : (
                <div className="h-5 w-36 animate-pulse rounded-md bg-muted" aria-hidden="true" />
              )}
              <p className="truncate text-xs text-muted-foreground">
                {path === "/"
                  ? "Here's what's happening across your properties"
                  : `${PAGE_TITLES[path] ?? "Sankofa Rent"} · Sankofa Rent`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              aria-label={
                effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
              title={effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground pressable hover:bg-muted hover:text-foreground"
            >
              {effectiveTheme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>
            <Link
              to="/announcements"
              aria-label="Announcements"
              className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground pressable hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-[18px] w-[18px]" />
            </Link>
            {/* Avatar is shown in the sidebar account pill on desktop — not duplicated here */}
          </div>
        </div>
      </header>

      {/* `w-full` matters: this sits inside a column flex container, so `mx-auto`
          disables the default stretch and the box would shrink to its content
          width (centred, and as narrow as 200px on quiet pages). */}
      <div className="mx-auto w-full max-w-[1400px] sm:px-6 sm:flex-1 sm:overflow-hidden sm:flex sm:flex-col">
        <div className="flex w-full gap-6 sm:pt-6 sm:flex-1 sm:overflow-hidden">
          {/* Desktop sidebar — an icon rail that expands to labelled sections */}
          <aside
            className={`hidden h-full shrink-0 flex-col justify-between overflow-hidden rounded-3xl bg-card py-5 shadow-soft transition-[width] duration-200 ease-out sm:flex ${
              navExpanded ? "w-64 items-stretch px-3" : "w-[4.5rem] items-center"
            }`}
          >
            <nav className="flex flex-col gap-1" id="primary-navigation" aria-label="Primary">
              {DESKTOP_NAV.map((n) => {
                const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    title={navExpanded ? undefined : n.label}
                    aria-label={n.label}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex h-11 items-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      navExpanded ? "gap-3 px-3" : "justify-center"
                    } ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                    )}
                    <n.icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                    <span className={`truncate text-sm font-medium ${navExpanded ? "" : "hidden"}`}>
                      {n.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <div
              className={`flex flex-col gap-1 ${navExpanded ? "items-stretch" : "items-center"}`}
            >
              {/* Settings link */}
              <Link
                to="/settings"
                title={navExpanded ? undefined : "Settings"}
                aria-label="Settings"
                aria-current={path.startsWith("/settings") ? "page" : undefined}
                className={`relative flex h-11 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                  navExpanded ? "gap-3 px-3" : "justify-center"
                } ${
                  path.startsWith("/settings")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {path.startsWith("/settings") && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                )}
                <Settings
                  className="h-5 w-5 shrink-0"
                  strokeWidth={path.startsWith("/settings") ? 2.2 : 1.8}
                />
                <span className={`truncate text-sm font-medium ${navExpanded ? "" : "hidden"}`}>
                  Settings
                </span>
                {(pendingResetCount ?? 0) > 0 && (
                  <span
                    className={`rounded-full bg-amber-500 font-bold text-white ${
                      navExpanded
                        ? "ml-auto px-1.5 py-0.5 text-[10px]"
                        : "absolute right-2 top-2 h-2 w-2 ring-2 ring-background"
                    }`}
                  >
                    {navExpanded ? pendingResetCount : ""}
                  </span>
                )}
              </Link>

              {/* Log out */}
              <button
                onClick={logout}
                title={navExpanded ? undefined : "Log out"}
                aria-label="Log out"
                className={`relative flex h-11 items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                  navExpanded ? "gap-3 px-3" : "justify-center"
                }`}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span className={`truncate text-sm font-medium ${navExpanded ? "" : "hidden"}`}>
                  Log out
                </span>
              </button>

              {/* Account pill */}
              <Link
                to="/settings"
                title={navExpanded ? undefined : fullName || "Your account"}
                aria-label={fullName ? `Settings – ${fullName}` : "Settings"}
                className={`mt-1 flex h-12 items-center rounded-xl bg-ink ring-2 ring-transparent hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow ${
                  navExpanded ? "gap-3 px-2" : "justify-center"
                }`}
              >
                <AvatarCircle
                  initials={avatar}
                  className="h-9 w-9 shrink-0 bg-transparent text-xs"
                />
                <span
                  className={`truncate text-xs font-semibold text-ink-foreground ${navExpanded ? "" : "hidden"}`}
                >
                  {profileReady && fullName ? fullName : "Account"}
                </span>
              </Link>

              {/* Expand / collapse */}
              <button
                onClick={() => setNavExpanded((v) => !v)}
                aria-expanded={navExpanded}
                aria-controls="primary-navigation"
                title={navExpanded ? "Collapse navigation" : "Expand navigation"}
                aria-label={navExpanded ? "Collapse navigation" : "Expand navigation"}
                className={`flex h-10 items-center rounded-xl border-t border-border/70 pt-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                  navExpanded ? "gap-2 px-3" : "w-full justify-center"
                }`}
              >
                {navExpanded ? (
                  <ChevronsLeft className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronsRight className="h-4 w-4 shrink-0" />
                )}
                <span className={`truncate text-xs font-semibold ${navExpanded ? "" : "hidden"}`}>
                  Collapse
                </span>
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main
            className="min-w-0 flex-1 sm:overflow-y-auto px-3 pb-nav pt-[calc(3.75rem+var(--sat)+1rem)] sm:px-0 sm:pb-6 sm:pt-0"
            style={{ marginBottom: "var(--keyboard-offset, 0px)" }}
          >
            {profile?.mustChangePassword && (
              <div className="mb-4">
                <TemporaryPasswordBanner onOpenModal={() => setMustChangePwModalOpen(true)} />
              </div>
            )}
            {/* Route content is rendered directly — no keyed animation wrapper.
                Keying on the path remounts every page query and list, which
                shows a blank beat and a skeleton/"loading again" flash on
                every tab change. Navigation should feel instant; the shell
                and tab bar provide the continuity. */}
            {children}
          </main>
        </div>
      </div>

      {/* Must change temporary password modal */}
      {profile?.mustChangePassword && (
        <MustChangePasswordModal
          open={mustChangePwModalOpen}
          onOpenChange={setMustChangePwModalOpen}
        />
      )}

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar
        path={path}
        onLogout={logout}
        profile={profile}
        pendingResetCount={pendingResetCount}
      />
    </div>
  );
}

// ─── Shared presentational components ────────────────────────────────────────

/**
 * Profile avatar. While the profile query is still in flight (or when the
 * account genuinely has no name yet) we show a neutral person glyph instead of
 * a bare "?" — a question mark reads as an error, not as a loading state.
 */
export function AvatarCircle({
  initials: text,
  className = "",
  iconClassName = "h-4 w-4",
}: {
  initials: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-ink font-semibold text-ink-foreground ${className}`}
      aria-hidden="true"
    >
      {text ? (
        <span className="truncate">{text}</span>
      ) : (
        <User className={iconClassName} strokeWidth={2} />
      )}
    </span>
  );
}

export function Card({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-card p-5 shadow-soft sm:p-6 ${className}`}>{children}</div>
  );
}

const tones = {
  green: "bg-success-soft text-success",
  red: "bg-destructive-soft text-destructive",
  gold: "bg-gold-soft text-gold",
  gray: "bg-muted text-muted-foreground",
  purple: "bg-primary-soft text-primary",
  blue: "bg-primary-soft text-primary",
} as const;
export type Tone = keyof typeof tones;
export function Badge({
  tone = "gray",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "default",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "default" | "lg" | string;
  className?: string;
} & Omit<React.ComponentProps<"button">, "children" | "className">) {
  const v =
    variant === "primary"
      ? "bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90"
      : variant === "destructive"
        ? "bg-destructive text-destructive-foreground shadow-soft hover:opacity-90"
        : variant === "outline"
          ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          : "bg-muted text-foreground hover:bg-accent";
  const s =
    size === "sm"
      ? "px-2.5 py-1 text-xs"
      : size === "lg"
        ? "px-6 py-3 text-base"
        : "px-4 py-2.5 text-sm";
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-xl font-semibold transition pressable ${s} ${v} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const cedi = (n: number) =>
  "GH\u20B5 " + n.toLocaleString("en-GH", { minimumFractionDigits: 0 });
