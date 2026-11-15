import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  Users,
  Banknote,
  Wrench,
  Smartphone,
  ArrowUpRight,
  Megaphone,
  Building2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Badge } from "@/components/app/AppShell";
import { Progress } from "@/components/ui/progress";
import { cediFromPesewas, formatDateTime, PAYMENT_METHODS } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard \u2014 Sankofa Rent" },
      {
        name: "description",
        content:
          "Rent management for small landlords in Ghana: properties, tenants, invoices and payments in one place.",
      },
      {
        property: "og:title",
        content: "Sankofa Rent \u2014 Rent management for Ghanaian landlords",
      },
      {
        property: "og:description",
        content:
          "Rent management for small landlords in Ghana: properties, tenants, invoices and payments in one place.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const summary = useQuery(api.dashboard.summary, {});
  const monthly = useQuery(api.dashboard.monthly, {});
  const payments = useQuery(api.payments.list, {});
  const maintenance = useQuery(api.maintenance.list, {});
  const properties = useQuery(api.properties.list, {});
  const tenants = useQuery(api.tenants.list, {});
  const announcements = useQuery(api.announcements.list, {});
  const profile = useQuery(api.profiles.me, {});

  if (
    !summary ||
    !monthly ||
    !payments ||
    !maintenance ||
    !properties ||
    !tenants ||
    !announcements ||
    !profile
  ) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-28 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  const tenantById = new Map(tenants.map((t) => [t._id, t]));
  const unitById = new Map(
    properties.flatMap((p) => p.units.map((u) => [u._id, { unit: u, property: p }] as const)),
  );
  const unitCount = properties.reduce((s, p) => s + p.units.length, 0);
  const collectionRate =
    summary.expectedThisMonth > 0
      ? Math.round((summary.collectedThisMonth / summary.expectedThisMonth) * 100)
      : 0;
  const pinned = announcements.find((a) => a.pinned) ?? announcements[0];
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const firstName = profile.firstName ?? "";

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {/* Mobile greeting hero */}
      <div className="sm:hidden col-span-2 lg:col-span-4">
        <div className="flex items-center justify-between py-1">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight text-foreground">
              {firstName ? `Akwaaba, ${firstName}!` : "Akwaaba!"}
            </h2>
            <p className="truncate text-xs text-muted-foreground mt-0.5">
              Here's your property overview
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            Active
          </span>
        </div>
      </div>

      {/* KPI: Collected this month */}
      <Card className="!p-4 flex items-center gap-2 sm:!p-6">
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs text-muted-foreground sm:text-sm">Collected</p>
          <p
            className="mt-1 font-semibold tabular-nums truncate"
            style={{ fontSize: "clamp(0.9rem, 3.8vw, 1.5rem)" }}
          >
            {cediFromPesewas(summary.collectedThisMonth)}
          </p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success-soft text-success sm:h-12 sm:w-12">
          <Banknote className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </Card>

      {/* KPI: Occupancy */}
      <Card className="flex items-center gap-2 !p-4 sm:!p-6">
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs text-muted-foreground sm:text-sm">Occupancy</p>
          <p
            className="mt-1 font-semibold tabular-nums truncate"
            style={{ fontSize: "clamp(0.9rem, 3.8vw, 1.5rem)" }}
          >
            {summary.occupancyPercent}%
          </p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary sm:h-12 sm:w-12">
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </Card>

      {/* KPI: Arrears */}
      <Card className="flex items-center gap-2 !p-4 sm:!p-6">
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs text-muted-foreground sm:text-sm">Arrears</p>
          <p
            className="mt-1 font-semibold tabular-nums truncate"
            style={{ fontSize: "clamp(0.9rem, 3.8vw, 1.5rem)" }}
          >
            {cediFromPesewas(summary.arrears)}
          </p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-soft text-gold sm:h-12 sm:w-12">
          <Banknote className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </Card>

      {/* KPI: Expected this month */}
      <Card className="relative overflow-hidden bg-gradient-primary text-primary-foreground !p-4 sm:!p-6 flex flex-col justify-between">
        <div>
          <p className="text-xs opacity-80 sm:text-sm">Expected</p>
          <p
            className="mt-1 font-semibold tabular-nums"
            style={{ fontSize: "clamp(1rem, 4.5vw, 1.5rem)" }}
          >
            {cediFromPesewas(summary.expectedThisMonth)}
          </p>
        </div>
      </Card>

      {/* Rent collection chart */}
      <Card className="col-span-2 lg:col-span-2 min-w-0 overflow-hidden min-h-[280px] sm:min-h-[380px] flex flex-col">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base font-semibold sm:text-xl">Rent collection</h3>
            <Badge tone="green">Last 6 months</Badge>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="rounded-2xl bg-muted/40 px-3 py-2 min-w-0">
            <p className="text-xs text-muted-foreground">Collected</p>
            <p className="font-semibold text-sm tabular-nums">
              {cediFromPesewas(monthly.reduce((s, m) => s + m.collected, 0))}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/40 px-3 py-2 min-w-0">
            <p className="text-xs text-muted-foreground">Invoiced</p>
            <p className="font-semibold text-sm tabular-nums">
              {cediFromPesewas(monthly.reduce((s, m) => s + m.due, 0))}
            </p>
          </div>
        </div>
        {/* The chart grows into whatever height the card has, so the card never
            ends up with a large empty band under the plot. */}
        <div className="mt-4 min-h-[10rem] flex-1 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} barGap={4} margin={{ left: -16, right: 8, top: 4, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                interval="preserveStartEnd"
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                formatter={(v) => cediFromPesewas(Number(v))}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "var(--shadow-soft)",
                  fontSize: 13,
                }}
              />
              <Bar
                dataKey="due"
                name="Invoiced"
                fill="var(--chart-2)"
                radius={[6, 6, 6, 6] as unknown as number}
                maxBarSize={32}
                animationDuration={600}
              />
              <Bar
                dataKey="collected"
                name="Collected"
                fill="var(--chart-1)"
                radius={[6, 6, 6, 6] as unknown as number}
                maxBarSize={32}
                animationDuration={600}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Collection rate */}
      <Card className="col-span-2 sm:col-span-1 min-h-[160px] sm:min-h-[380px] flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold sm:text-xl">Collection rate</h3>
          <p className="text-xs text-muted-foreground sm:text-sm">This month</p>
        </div>
        <div className="flex-1 flex flex-col justify-center py-3 sm:py-0">
          <p className="text-3xl font-semibold text-primary sm:text-4xl tabular-nums">
            {collectionRate}%
          </p>
          <Progress value={collectionRate} className="mt-3 h-2" />
          <p className="mt-2 text-[11px] text-muted-foreground">
            {cediFromPesewas(summary.collectedThisMonth)} of{" "}
            {cediFromPesewas(summary.expectedThisMonth)} expected
          </p>
        </div>
      </Card>

      {/* Portfolio overview card — clean, structured, and no duplicate profile avatar or empty void */}
      <Card className="col-span-2 sm:col-span-1 min-h-[160px] sm:min-h-[380px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold sm:text-xl">Portfolio overview</h3>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
            Active rental spaces & occupancy
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 my-4">
          <Link
            to="/properties"
            className="rounded-xl bg-muted/40 p-2.5 sm:p-3 text-center transition hover:bg-muted pressable"
          >
            <p className="text-xs text-muted-foreground">Properties</p>
            <p className="text-lg sm:text-2xl font-bold tabular-nums text-foreground mt-0.5">
              {properties.length}
            </p>
          </Link>
          <Link
            to="/properties"
            className="rounded-xl bg-muted/40 p-2.5 sm:p-3 text-center transition hover:bg-muted pressable"
          >
            <p className="text-xs text-muted-foreground">Units</p>
            <p className="text-lg sm:text-2xl font-bold tabular-nums text-foreground mt-0.5">
              {unitCount}
            </p>
          </Link>
          <Link
            to="/tenants"
            className="rounded-xl bg-muted/40 p-2.5 sm:p-3 text-center transition hover:bg-muted pressable"
          >
            <p className="text-xs text-muted-foreground">Tenants</p>
            <p className="text-lg sm:text-2xl font-bold tabular-nums text-foreground mt-0.5">
              {tenants.length}
            </p>
          </Link>
        </div>

        <div className="border-t border-border pt-3">
          <Link
            to="/properties"
            className="flex items-center justify-between text-xs font-semibold text-primary hover:underline pressable"
          >
            <span>Manage properties & units</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Card>

      {/* Recent payments */}
      <Card className="col-span-2 lg:col-span-2 min-h-[260px]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold sm:text-xl">Recent payments</h3>
          <Link
            to="/payments"
            className="-my-2 flex min-h-11 items-center gap-1 py-2 text-sm font-semibold text-primary"
          >
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {payments.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No payments recorded yet.
            </p>
          )}
          {payments.slice(0, 4).map((p) => (
            <div
              key={p._id}
              className="flex items-center justify-between gap-3 py-1 border-b border-border/40 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm">
                  {tenantById.get(p.tenantId)?.name ?? "Tenant"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {PAYMENT_METHODS[p.method] ?? p.method} &middot; {formatDateTime(p.paidAt)}
                </p>
              </div>
              <Badge tone="green">+{cediFromPesewas(p.amount)}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Maintenance */}
      <Card className="col-span-2 sm:col-span-1 min-h-[260px]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold sm:text-xl">Maintenance</h3>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-4 space-y-3">
          {maintenance.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No open requests.</p>
          )}
          {maintenance
            .filter((m) => m.status !== "resolved")
            .slice(0, 3)
            .map((m) => (
              <Link
                key={m._id}
                to="/maintenance"
                className="block rounded-xl p-2 bg-muted/30 transition hover:bg-muted/60 active:opacity-70"
              >
                <p className="text-sm font-semibold truncate">{m.title}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-xs text-muted-foreground">
                    {(m.unitId ? unitById.get(m.unitId)?.property.name : undefined) ?? "Property"}
                  </span>
                  <Badge
                    tone={m.priority === "high" ? "red" : m.priority === "medium" ? "gold" : "gray"}
                  >
                    {m.status.replace("_", " ")}
                  </Badge>
                </div>
              </Link>
            ))}
        </div>
      </Card>

      {/* MoMo card */}
      <Card className="col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col items-center justify-center text-center p-5 sm:p-6 min-h-[200px] sm:min-h-[260px]">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Smartphone className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h3 className="mt-2.5 text-base font-semibold sm:text-lg">Get paid by MoMo</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-[24ch]">
          Let tenants pay rent with MTN, Telecel or AirtelTigo with instant receipts.
        </p>
        <Link
          to="/settings"
          search={{ tab: "payments" }}
          className="mt-3.5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-muted px-4 text-xs sm:text-sm font-semibold transition hover:bg-accent sm:w-auto pressable"
        >
          Set up MoMo <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </Card>

      {/* Tenant Announcement & Notice Board banner */}
      <Card className="col-span-2 lg:col-span-4 border border-border/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Tenant Notice Board
                </span>
                {pinned && <Badge tone="gold">Pinned</Badge>}
              </div>
              {pinned ? (
                <>
                  <p className="font-semibold text-sm sm:text-base truncate mt-0.5">
                    {pinned.title}
                  </p>
                  <p className="line-clamp-1 text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {pinned.body}
                  </p>
                </>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Publish updates, maintenance alerts, or rent notices directly to your tenants.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 sm:pt-0 shrink-0">
            <Link
              to="/notices"
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground transition hover:bg-muted pressable"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Public Notice Board</span>
            </Link>
            <Link
              to="/announcements"
              className="inline-flex h-9 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 pressable"
            >
              <span>Manage Notices</span>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
