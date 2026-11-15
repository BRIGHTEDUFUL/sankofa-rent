import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Users, Banknote, Wrench, Smartphone, ArrowUpRight, Megaphone } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Badge } from "@/components/app/AppShell";
import { Progress } from "@/components/ui/progress";
import { cediFromPesewas, formatDateTime, initials, PAYMENT_METHODS } from "@/lib/format";

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
        <div className="mb-1 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-ink-foreground">
            {initials(fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold leading-tight">
              {firstName ? `Akwaaba, ${firstName}!` : "Akwaaba!"}
            </p>
            <p className="truncate text-xs text-muted-foreground">Here's your property overview</p>
          </div>
        </div>
      </div>

      {/* KPI: Collected this month */}
      <Card className="!p-4 flex items-center justify-between sm:!p-6">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground sm:text-sm">Collected this month</p>
          <p
            className="mt-1 font-semibold tabular-nums whitespace-nowrap"
            style={{ fontSize: "clamp(0.95rem, 4.2vw, 1.5rem)" }}
          >
            {cediFromPesewas(summary.collectedThisMonth)}
          </p>
        </div>
        <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-success-soft text-success sm:grid">
          <Banknote className="h-5 w-5" />
        </div>
      </Card>

      {/* KPI: Occupancy */}
      <Card className="flex items-center gap-3 !p-4 sm:gap-4 sm:!p-6">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary sm:h-12 sm:w-12">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground sm:text-sm">Occupancy</p>
          <p
            className="font-semibold tabular-nums"
            style={{ fontSize: "clamp(1rem, 4.5vw, 1.5rem)" }}
          >
            {summary.occupancyPercent}%
          </p>
        </div>
      </Card>

      {/* KPI: Arrears */}
      <Card className="flex items-center gap-3 !p-4 sm:gap-4 sm:!p-6">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-soft text-gold sm:h-12 sm:w-12">
          <Banknote className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground sm:text-sm">Arrears</p>
          <p
            className="font-semibold tabular-nums"
            style={{ fontSize: "clamp(1rem, 4.5vw, 1.5rem)" }}
          >
            {cediFromPesewas(summary.arrears)}
          </p>
        </div>
      </Card>

      {/* KPI: Expected this month */}
      <Card className="relative overflow-hidden bg-gradient-primary text-primary-foreground !p-4 sm:!p-6">
        <p className="text-xs opacity-80 sm:text-sm">Expected this month</p>
        <p
          className="mt-1 font-semibold tabular-nums"
          style={{ fontSize: "clamp(1rem, 4.5vw, 1.5rem)" }}
        >
          {cediFromPesewas(summary.expectedThisMonth)}
        </p>
      </Card>

      {/* Rent collection chart */}
      <Card className="col-span-2 lg:col-span-2 min-w-0 overflow-hidden min-h-[400px] flex flex-col">
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
        <div className="mt-4 min-h-[11rem] flex-1 overflow-hidden">
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
      <Card className="col-span-2 sm:col-span-1 min-h-[220px] sm:min-h-[400px] flex flex-col">
        <h3 className="text-base font-semibold sm:text-xl">Collection rate</h3>
        <p className="text-xs text-muted-foreground sm:text-sm">This month</p>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-3xl font-semibold text-primary sm:text-4xl tabular-nums">
            {collectionRate}%
          </p>
          <Progress value={collectionRate} className="mt-4 h-2" />
          <p className="mt-2 text-[11px] text-muted-foreground">
            {cediFromPesewas(summary.collectedThisMonth)} of{" "}
            {cediFromPesewas(summary.expectedThisMonth)} expected
          </p>
        </div>
      </Card>

      {/* Profile card. The identity row is hidden on mobile because the hero
          above already shows the same avatar and name — only the counts are
          new information there. */}
      <Card className="col-span-2 sm:col-span-1 min-h-[220px] sm:min-h-[400px] flex flex-col justify-between">
        <div className="hidden flex-row items-center gap-4 sm:flex sm:flex-col sm:text-center">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-base font-semibold text-ink-foreground sm:h-16 sm:w-16 sm:text-lg">
            {initials(fullName)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold sm:mt-3 sm:text-lg">
              {fullName || "Your profile"}
            </h3>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {profile.businessName || profile.phone || "Add your business details in Settings"}
            </p>
          </div>
        </div>
        <div className="mt-4 w-full border-t border-border pt-4">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["Properties", properties.length],
                ["Units", unitCount],
                ["Tenants", tenants.length],
              ] as [string, number][]
            ).map(([l, v]) => (
              <div key={l}>
                <p className="text-xs text-muted-foreground">{l}</p>
                <p className="text-lg font-semibold sm:text-xl tabular-nums">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent payments */}
      <Card className="col-span-2 lg:col-span-2 min-h-[280px]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold sm:text-xl">Recent payments</h3>
          <Link
            to="/payments"
            className="-my-2 flex min-h-11 items-center gap-1 py-2 text-sm font-semibold text-primary"
          >
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {payments.length === 0 && (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          )}
          {payments.slice(0, 4).map((p) => (
            <div key={p._id} className="flex items-center justify-between gap-3 py-0.5">
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
      <Card className="col-span-2 sm:col-span-1 min-h-[280px]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold sm:text-xl">Maintenance</h3>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-4 space-y-3">
          {maintenance.length === 0 && (
            <p className="text-sm text-muted-foreground">No open requests.</p>
          )}
          {maintenance
            .filter((m) => m.status !== "resolved")
            .slice(0, 3)
            .map((m) => (
              <Link
                key={m._id}
                to="/maintenance"
                className="block rounded-2xl transition active:opacity-70"
              >
                <p className="text-sm font-semibold">{m.title}</p>
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
      <Card className="col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col items-center justify-center text-center min-h-[280px]">
        <Smartphone className="h-10 w-10 text-primary sm:h-12 sm:w-12" strokeWidth={1.5} />
        <h3 className="mt-3 text-base font-semibold sm:text-xl">Get paid by MoMo</h3>
        <p className="text-sm text-muted-foreground">
          Let tenants pay rent with MTN, Telecel or AirtelTigo and get instant receipts.
        </p>
        <Link
          to="/settings"
          search={{ tab: "payments" }}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-muted px-4 text-sm font-semibold transition hover:bg-accent sm:w-auto"
        >
          Set up MoMo <ArrowUpRight className="h-4 w-4" />
        </Link>
      </Card>

      {/* Pinned announcement */}
      <Card className="col-span-2 lg:col-span-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            {pinned ? (
              <>
                <p className="truncate font-semibold">{pinned.title}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{pinned.body}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            )}
          </div>
          <Link
            to="/announcements"
            className="-my-2 flex min-h-11 w-full shrink-0 items-center py-2 text-sm font-semibold text-primary sm:w-auto"
          >
            All announcements
          </Link>
        </div>
      </Card>
    </div>
  );
}
