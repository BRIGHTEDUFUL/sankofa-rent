import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
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
  Search,
  Bell,
  MessageCircle,
  Sun,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useBranding } from "@/lib/branding";
import { initials } from "@/lib/format";

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
    <div className="min-h-screen p-3 sm:p-6">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-4 grid sm:mb-6 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center text-primary sm:h-12 sm:w-12">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-8 w-8 rounded-lg object-contain sm:h-10 sm:w-10"
                  width={40}
                  height={40}
                />
              ) : (
                <Sun className="h-8 w-8 sm:h-10 w-10" strokeWidth={2.5} />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold sm:text-2xl">{greeting}</h1>
              <p className="hidden truncate text-sm text-muted-foreground sm:block">
                Here's what's happening across your properties
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center rounded-full bg-card py-1.5 pl-5 pr-1.5 shadow-soft md:flex">
              <input
                placeholder="Search tenants, units…"
                className="w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button className="grid h-9 w-9 place-items-center rounded-full bg-ink text-ink-foreground">
                <Search className="h-4 w-4" />
              </button>
            </div>
            <button className="relative grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-card shadow-soft">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <button className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-card shadow-soft">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex gap-4 sm:gap-6">
          <aside className="sticky top-6 hidden h-[calc(100vh-8rem)] w-16 shrink-0 flex-col items-center justify-between rounded-full bg-card py-4 shadow-soft sm:flex">
            <nav className="flex flex-col items-center gap-2">
              {nav.map((n) => {
                const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    title={n.label}
                    className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${active ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
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
                className={`grid h-11 w-11 place-items-center rounded-full ${path.startsWith("/settings") ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <div className="mt-2 grid h-10 w-10 place-items-center rounded-full bg-ink text-xs font-semibold text-ink-foreground">
                {avatar}
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 pb-24 sm:pb-0 [padding-bottom:calc(6rem+env(safe-area-inset-bottom))] sm:![padding-bottom:0]">
            {children}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 flex justify-between gap-1 overflow-x-auto rounded-full [scrollbar-width:none] bg-card p-1.5 shadow-soft sm:hidden">
        {nav.map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${active ? "bg-ink text-ink-foreground" : "text-muted-foreground"}`}
            >
              <n.icon className="h-[18px] w-[18px]" />
            </Link>
          );
        })}
        <Link
          to="/settings"
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${path.startsWith("/settings") ? "bg-ink text-ink-foreground" : "text-muted-foreground"}`}
        >
          <Settings className="h-[18px] w-[18px]" />
        </Link>
      </nav>
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
