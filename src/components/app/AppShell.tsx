import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
  Menu,
  ChevronRight,
  Sun,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useBranding } from "@/lib/branding";
import { initials } from "@/lib/format";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/properties", label: "Properties & units", icon: Building2 },
  { to: "/tenants", label: "Tenants", icon: Users },
  { to: "/leases", label: "Leases", icon: FileSignature },
  { to: "/invoices", label: "Rent invoices", icon: Receipt },
  { to: "/payments", label: "Payments & receipts", icon: Wallet },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
] as const;

const PRIMARY_TABS = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/invoices", label: "Invoices", icon: Receipt },
  { to: "/payments", label: "Payments", icon: Wallet },
] as const;

const MORE_ITEMS = [
  { to: "/properties", label: "Properties & units", icon: Building2 },
  { to: "/tenants", label: "Tenants", icon: Users },
  { to: "/leases", label: "Leases", icon: FileSignature },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
] as const;

function MobileTabBar({
  path,
  onLogout,
}: {
  path: string;
  avatar: string;
  onLogout: () => void | Promise<void>;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
  const moreActive = [...MORE_ITEMS, { to: "/settings" }].some((m) => path.startsWith(m.to));
  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl pb-safe sm:hidden"
      >
        <div className="mx-auto grid h-16 max-w-lg grid-cols-4">
          {PRIMARY_TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={isActive(tab.to) ? "page" : undefined}
              onClick={() => {
                try {
                  navigator.vibrate?.(8);
                } catch {
                  // Haptics are a progressive enhancement — ignore failures.
                }
              }}
              className={`flex flex-col items-center justify-center gap-0.5 pressable ${isActive(tab.to) ? "text-primary" : "text-muted-foreground"}`}
            >
              <tab.icon className="h-6 w-6" strokeWidth={isActive(tab.to) ? 2.2 : 1.8} />
              <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            aria-label="More sections"
            className={`flex flex-col items-center justify-center gap-0.5 pressable ${moreActive ? "text-primary" : "text-muted-foreground"}`}
          >
            <Menu className="h-6 w-6" strokeWidth={moreActive ? 2.2 : 1.8} />
            <span className="text-[10px] font-semibold leading-none">More</span>
          </button>
        </div>
      </nav>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-0 bg-card">
          <DrawerHeader className="px-5 pb-2 pt-1 text-left">
            <DrawerTitle className="text-base font-semibold">More</DrawerTitle>
            <DrawerDescription className="sr-only">
              More sections and account actions
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid grid-cols-3 gap-2 px-4">
            {MORE_ITEMS.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-muted px-2 py-4 pressable"
              >
                <m.icon className="h-6 w-6 text-primary" />
                <span className="text-center text-[11px] font-semibold leading-tight text-foreground">
                  {m.label}
                </span>
              </Link>
            ))}
          </div>
          <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3">
            <div className="overflow-hidden rounded-2xl bg-muted">
              <Link
                to="/settings"
                onClick={() => setMoreOpen(false)}
                className="flex min-h-[52px] items-center gap-3 px-4 text-sm font-semibold pressable"
              >
                <Settings className="h-5 w-5 text-primary" /> Settings
                <span className="ml-auto text-muted-foreground">
                  <ChevronRight className="h-5 w-5" />
                </span>
              </Link>
              <div className="h-px bg-border" />
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onLogout();
                }}
                className="flex min-h-[52px] w-full items-center gap-3 px-4 text-sm font-semibold text-destructive pressable"
              >
                <LogOut className="h-5 w-5" /> Sign out
              </button>
            </div>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Sankofa Rent · v1.0
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const profile = useQuery(api.profiles.me, isAuthenticated ? {} : "skip");
  const { logoUrl } = useBranding();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect in an effect, never during render.
      navigate({ to: "/login", replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  async function logout() {
    await signOut();
    // Hard reload recreates the module-level Convex client. A client-side
    // navigate leaves stale auth/websocket state behind, and repeated
    // sign-out/sign-in cycles in the same tab then silently never resolve
    // queries (app stuck on the skeleton shell).
    window.location.assign("/login");
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const firstName = profile?.firstName ?? "";
  const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  const greeting = firstName ? `Akwaaba, ${firstName}!` : "Akwaaba!";
  const avatar = initials(fullName);

  return (
    <div className="min-h-screen sm:p-6">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl pt-safe">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
            <div className="grid h-7 w-7 shrink-0 place-items-center text-primary sm:h-12 sm:w-12">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-7 w-7 rounded-lg object-contain sm:h-10 sm:w-10"
                  width={28}
                  height={28}
                />
              ) : (
                <Sun className="h-7 w-7 sm:h-10 sm:w-10" strokeWidth={2.5} />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold sm:text-2xl sm:font-semibold">
                {greeting}
              </h1>
              <p className="hidden truncate text-sm text-muted-foreground sm:block">
                Here's what's happening across your properties
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/announcements"
              aria-label="Announcements"
              className="grid h-11 w-11 place-items-center rounded-full text-foreground pressable hover:bg-muted"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <Link to="/settings" aria-label="Settings">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-ink text-xs font-semibold text-ink-foreground pressable">
                {avatar}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px]">
        <div className="flex gap-6 sm:pt-6">
          <aside className="sticky top-6 hidden h-[calc(100vh-8rem)] w-16 shrink-0 flex-col items-center justify-between rounded-full bg-card py-4 shadow-soft sm:flex">
            <nav className="flex flex-col items-center gap-2" aria-label="Primary">
              {nav.map((n) => {
                const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    title={n.label}
                    aria-label={n.label}
                    aria-current={active ? "page" : undefined}
                    className={`grid h-11 w-11 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    <n.icon className="h-5 w-5" />
                  </Link>
                );
              })}
            </nav>
            <div className="flex flex-col items-center gap-2">
              <Link
                to="/settings"
                title="Settings"
                aria-label="Settings"
                aria-current={path.startsWith("/settings") ? "page" : undefined}
                className={`grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${path.startsWith("/settings") ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={logout}
                title="Log out"
                aria-label="Log out"
                className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <div
                role="img"
                aria-label={fullName ? `Account avatar for ${fullName}` : "Your account"}
                className="mt-2 grid h-10 w-10 place-items-center rounded-full bg-ink text-xs font-semibold text-ink-foreground"
              >
                {avatar}
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-0 sm:pb-0 sm:pt-0">
            {children}
          </main>
        </div>
      </div>

      <MobileTabBar path={path} avatar={avatar} onLogout={logout} />
    </div>
  );
}

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

export const cedi = (n: number) => "GH₵ " + n.toLocaleString("en-GH", { minimumFractionDigits: 0 });
