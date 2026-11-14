import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Users, Banknote, Wrench, Smartphone, ArrowUpRight, Megaphone } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Badge, Button } from "@/components/app/AppShell";
import { cediFromPesewas, formatDateTime, initials, PAYMENT_METHODS } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Sankofa Rent" },
      {
        name: "description",
        content:
          "Rent management for small landlords in Ghana: properties, tenants, invoices and payments in one place.",
      },
      { property: "og:title", content: "Sankofa Rent — Rent management for Ghanaian landlords" },
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
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-24 animate-pulse bg-muted/40" />
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

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Collected this month</p>
          <p className="mt-1 text-2xl font-semibold">
            {cediFromPesewas(summary.collectedThisMonth)}
          </p>
        </div>
        <div className="flex h-10 items-end gap-1">
          {[60, 90, 50, 100, 30].map((h, i) => (
            <span key={i} style={{ height: h + "%" }} className="w-1.5 rounded-full bg-primary" />
          ))}
        </div>
      </Card>
      <Card className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Occupancy</p>
          <p className="text-2xl font-semibold">{summary.occupancyPercent}%</p>
        </div>
      </Card>
      <Card className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gold-soft text-gold">
          <Banknote className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Arrears</p>
          <p className="text-2xl font-semibold">{cediFromPesewas(summary.arrears)}</p>
        </div>
      </Card>
      <Card className="relative overflow-hidden bg-gradient-primary text-primary-foreground">
        <p className="text-sm opacity-80">Expected this month</p>
        <p className="mt-1 text-2xl font-semibold">{cediFromPesewas(summary.expectedThisMonth)}</p>
        <div className="absolute bottom-2 right-3 h-12 w-24 opacity-70">
          <ResponsiveContainer>
            <AreaChart data={monthly}>
              <Area
                dataKey="due"
                type="monotone"
                stroke="currentColor"
                strokeWidth={2.5}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Rent collection</h3>
            <Badge tone="green">Last 6 months</Badge>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-2xl px-4 py-2 shadow-soft">
            <p className="text-xs text-muted-foreground">Collected</p>
            <p className="font-semibold">
              {cediFromPesewas(monthly.reduce((s, m) => s + m.collected, 0))}
            </p>
          </div>
          <div className="rounded-2xl px-4 py-2 shadow-soft">
            <p className="text-xs text-muted-foreground">Invoiced</p>
            <p className="font-semibold">
              {cediFromPesewas(monthly.reduce((s, m) => s + m.due, 0))}
            </p>
          </div>
        </div>
        <div className="mt-4 h-48">
          <ResponsiveContainer>
            <BarChart data={monthly} barGap={4}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                formatter={(v) => cediFromPesewas(Number(v))}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "var(--shadow-soft)" }}
              />
              <Bar dataKey="due" name="Invoiced" fill="var(--chart-2)" radius={[8, 8, 8, 8]} />
              <Bar
                dataKey="collected"
                name="Collected"
                fill="var(--chart-1)"
                radius={[8, 8, 8, 8]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Collection rate</h3>
        <p className="text-sm text-muted-foreground">This month</p>
        <p className="mt-3 text-2xl font-semibold text-primary">{collectionRate}%</p>
        <div className="relative mx-auto mt-4 w-44">
          <svg viewBox="0 0 100 55" className="w-full">
            <path
              d="M10 50 A40 40 0 0 1 90 50"
              fill="none"
              stroke="var(--muted)"
              strokeWidth="14"
            />
            <path
              d="M10 50 A40 40 0 0 1 90 50"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="14"
              pathLength={100}
              strokeDasharray={`${collectionRate} 100`}
            />
          </svg>
          <p className="absolute inset-x-0 bottom-0 text-center text-2xl font-semibold">
            {collectionRate}%
          </p>
        </div>
      </Card>

      <Card className="flex flex-col items-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-ink text-lg font-semibold text-ink-foreground">
          {initials(fullName)}
        </div>
        <h3 className="mt-3 text-lg font-semibold">{fullName || "Your profile"}</h3>
        <p className="text-sm text-muted-foreground">
          {profile.businessName || profile.phone || "Add your business details in Settings"}
        </p>
        <div className="mt-5 grid w-full grid-cols-3">
          {[
            ["Properties", properties.length],
            ["Units", unitCount],
            ["Tenants", tenants.length],
          ].map(([l, v]) => (
            <div key={l as string}>
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="text-xl font-semibold">{v}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent payments</h3>
          <Link
            to="/payments"
            className="flex items-center gap-1 text-sm font-semibold text-primary"
          >
            View all
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {payments.length === 0 && (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          )}
          {payments.slice(0, 4).map((p) => (
            <div
              key={p._id}
              className="flex items-center justify-between border-l-4 border-primary pl-3"
            >
              <div>
                <p className="font-semibold">{tenantById.get(p.tenantId)?.name ?? "Tenant"}</p>
                <p className="text-xs text-muted-foreground">
                  {PAYMENT_METHODS[p.method] ?? p.method} · {formatDateTime(p.paidAt)}
                </p>
              </div>
              <Badge tone="green">+{cediFromPesewas(p.amount)}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Maintenance</h3>
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
              <div key={m._id}>
                <p className="text-sm font-semibold">{m.title}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {(m.unitId ? unitById.get(m.unitId)?.property.name : undefined) ?? "Property"}
                  </span>
                  <Badge
                    tone={m.priority === "high" ? "red" : m.priority === "medium" ? "gold" : "gray"}
                  >
                    {m.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center text-center">
        <Smartphone className="h-12 w-12 text-primary" strokeWidth={1.5} />
        <h3 className="mt-3 text-lg font-semibold">Get paid by MoMo</h3>
        <p className="text-sm text-muted-foreground">
          Let tenants pay rent with MTN, Telecel or AirtelTigo and get instant receipts.
        </p>
        <Button className="mt-4" variant="ghost">
          Set up MoMo
        </Button>
      </Card>

      <Card className="lg:col-span-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            {pinned ? (
              <>
                <p className="font-semibold">{pinned.title}</p>
                <p className="truncate text-sm text-muted-foreground">{pinned.body}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            )}
          </div>
          <Link to="/announcements" className="text-sm font-semibold text-primary">
            All announcements
          </Link>
        </div>
      </Card>
    </div>
  );
}
