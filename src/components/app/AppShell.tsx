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
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useBranding } from "@/lib/branding";
import { initials } from "@/lib/format";
import { usePlatform } from "@/hooks/use-platform";
import { hapticTap } from "@/lib/haptics";
import { useRipple } from "@/hooks/use-ripple";
import { useTheme } from "@/hooks/use-theme";

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
        className={`h-14 flex items-center px-2 gap-1 backdrop-blur-xl ${scrolled ? "bg-background/90 border-b border-border/60" : "bg-transparent"}`}
      >
        {/* Left slot */}
        <div className="flex w-12 items-center justify-start">
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
              className="grid h-10 w-10 place-items-center rounded-full text-foreground pressable hover:bg-muted"
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
        <div className="flex w-auto items-center gap-1">
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground pressable hover:bg-muted"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link
            to="/announcements"
            aria-label="Announcements"
            className="grid h-10 w-10 place-items-center rounded-full text-foreground pressable hover:bg-muted"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <Link to="/settings" aria-label="Settings">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[11px] font-semibold text-ink-foreground pressable">
              {avatar}
            </div>
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
}: {
  path: string;
  onLogout: () => void | Promise<void>;
  profile:
    | { firstName?: string | null; lastName?: string | null; businessName?: string | null }
    | null
    | undefined;
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
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
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
            <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={moreActive ? 2.3 : 1.7} />
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
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-card sm:hidden flex flex-col max-h-[90dvh]"
              style={{ paddingBottom: "calc(var(--sab) + 1.25rem)" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              </div>

              {/* User info */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border/60 shrink-0">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-ink-foreground">
                  {avatarInitials}
                </div>
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
              <div className="overflow-y-auto overscroll-contain flex-1 min-h-0">
                {/* Navigation items */}
                <div className="grid grid-cols-3 gap-2 p-4">
                  {MORE_ITEMS.filter((m) => m.to !== "/settings").map((m) => (
                    <Link
                      key={m.to}
                      to={m.to}
                      onClick={() => {
                        hapticTap();
                        setMoreOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-muted px-2 py-4 pressable ${
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
                    Settings
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
                  Sankofa Rent · v1.0
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

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const profile = useQuery(api.profiles.me, isAuthenticated ? {} : "skip");
  const { logoUrl } = useBranding();
  const platform = usePlatform();
  const { toggle: toggleTheme, effective: effectiveTheme } = useTheme();

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
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const firstName = profile?.firstName ?? "";
  const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  const avatar = initials(fullName);

  // platform is used for the data-platform attribute set by usePlatform hook
  void platform;

  return (
    <div className="min-h-dvh sm:p-6">
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
              <h1 className="truncate text-lg font-semibold leading-tight">
                {firstName ? `Akwaaba, ${firstName}!` : "Akwaaba!"}
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Here's what's happening across your properties
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/announcements"
              aria-label="Announcements"
              className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground pressable hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-[18px] w-[18px]" />
            </Link>
            <Link to="/settings" aria-label="Settings">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[11px] font-semibold text-ink-foreground pressable ring-2 ring-transparent hover:ring-border">
                {avatar}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px]">
        <div className="flex gap-6 sm:pt-6">
          {/* Desktop sidebar */}
          <aside className="sticky top-6 hidden h-[calc(100vh-8rem)] w-16 shrink-0 flex-col items-center justify-between rounded-full bg-card py-4 shadow-soft sm:flex">
            <nav className="flex flex-col items-center gap-1.5" aria-label="Primary">
              {DESKTOP_NAV.map((n) => {
                const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    title={n.label}
                    aria-label={n.label}
                    aria-current={active ? "page" : undefined}
                    className={`grid h-11 w-11 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? "bg-ink text-ink-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <n.icon className="h-[18px] w-[18px]" />
                  </Link>
                );
              })}
            </nav>
            <div className="flex flex-col items-center gap-1.5">
              <Link
                to="/settings"
                title="Settings"
                aria-label="Settings"
                aria-current={path.startsWith("/settings") ? "page" : undefined}
                className={`grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                  path.startsWith("/settings")
                    ? "bg-ink text-ink-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Settings className="h-[18px] w-[18px]" />
              </Link>
              <button
                onClick={toggleTheme}
                title={effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={
                  effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
                }
                className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                {effectiveTheme === "dark" ? (
                  <Sun className="h-[18px] w-[18px]" />
                ) : (
                  <Moon className="h-[18px] w-[18px]" />
                )}
              </button>
              <button
                onClick={logout}
                title="Log out"
                aria-label="Log out"
                className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
              <div
                role="img"
                aria-label={fullName ? `Account avatar for ${fullName}` : "Your account"}
                className="mt-2 grid h-9 w-9 place-items-center rounded-full bg-ink text-[11px] font-semibold text-ink-foreground"
              >
                {avatar}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main
            className="min-w-0 flex-1 px-3 pb-nav pt-[calc(3.75rem+var(--sat)+1rem)] sm:px-0 sm:pb-6 sm:pt-0"
            style={{ marginBottom: "var(--keyboard-offset, 0px)" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={path}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar path={path} onLogout={logout} profile={profile} />
    </div>
  );
}

// ─── Shared presentational components ────────────────────────────────────────

export function Card({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`animate-rise rounded-3xl bg-card p-5 shadow-soft sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

const tones = {
  green: "bg-success-soft text-success",
  red: "bg-destructive-soft text-destructive",
  gold: "bg-gold-soft text-gold",
  gray: "bg-muted text-muted-foreground",
} as const;
export type Tone = keyof typeof tones;
export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: { children: ReactNode; variant?: "primary" | "ghost"; className?: string } & Omit<
  React.ComponentProps<"button">,
  "children" | "className"
>) {
  const v =
    variant === "primary"
      ? "bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90"
      : "bg-muted text-foreground hover:bg-accent";
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${v} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const cedi = (n: number) =>
  "GH\u20B5 " + n.toLocaleString("en-GH", { minimumFractionDigits: 0 });
