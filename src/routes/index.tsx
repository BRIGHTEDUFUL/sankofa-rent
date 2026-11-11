import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Users, Banknote, Wrench, Smartphone, ArrowUpRight, Megaphone } from "lucide-react";
import { Card, Badge, Button, cedi } from "@/components/app/AppShell";
import { monthly, payments, maintenance, announcements } from "@/lib/mock";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dashboard — Nyumba Rent" },
    { name: "description", content: "Rent management for small landlords in Ghana: properties, tenants, invoices and payments in one place." },
    { property: "og:title", content: "Nyumba Rent — Rent management for Ghanaian landlords" },
    { property: "og:description", content: "Properties, tenants, leases, invoicing, payments, maintenance and announcements in one place." },
  ] }),
  component: Dashboard,
});

const spark = [3, 5, 4, 7, 6, 8].map((v) => ({ v }));

function Dashboard() {
  const pct = 89;
  return (
    <div className="grid gap-4 sm:gap-5 lg:grid-cols-4">
      <Card className="flex items-center justify-between">
        <div><p className="text-sm text-muted-foreground">Collected this month</p><p className="mt-1 text-2xl font-semibold">{cedi(61300)}</p></div>
        <div className="flex h-10 items-end gap-1">{[60, 90, 50, 100, 30].map((h, i) => <span key={i} style={{ height: h + "%" }} className="w-1.5 rounded-full bg-primary" />)}</div>
      </Card>
      <Card className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary"><Users className="h-5 w-5" /></div>
        <div><p className="text-sm text-muted-foreground">Occupancy</p><p className="text-2xl font-semibold">35/40</p></div>
      </Card>
      <Card className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gold-soft text-gold"><Banknote className="h-5 w-5" /></div>
        <div><p className="text-sm text-muted-foreground">Arrears</p><p className="text-2xl font-semibold">{cedi(7100)}</p></div>
      </Card>
      <Card className="relative overflow-hidden bg-gradient-primary text-primary-foreground">
        <p className="text-sm opacity-80">Expected · Nov</p>
        <p className="mt-1 text-2xl font-semibold">{cedi(68500)}</p>
        <div className="absolute bottom-2 right-3 h-12 w-24 opacity-70">
          <ResponsiveContainer><AreaChart data={spark}><Area dataKey="v" type="monotone" stroke="currentColor" strokeWidth={2.5} fill="none" /></AreaChart></ResponsiveContainer>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><h3 className="text-lg font-semibold">Rent collection</h3><Badge tone="green">On track</Badge></div>
          <span className="text-xs text-muted-foreground">Last 6 months</span>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="rounded-2xl px-4 py-2 shadow-soft"><p className="text-xs text-muted-foreground">Collected</p><p className="font-semibold">{cedi(381800)} <Badge tone="green">+4.2%</Badge></p></div>
          <div className="rounded-2xl px-4 py-2 shadow-soft"><p className="text-xs text-muted-foreground">Missed</p><p className="font-semibold">{cedi(41200)} <Badge tone="red">-1.8%</Badge></p></div>
        </div>
        <div className="mt-4 h-48">
          <ResponsiveContainer>
            <BarChart data={monthly} barGap={4}>
              <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <Tooltip cursor={{ fill: "var(--muted)" }} formatter={(v: number) => cedi(v)} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "var(--shadow-soft)" }} />
              <Bar dataKey="due" fill="var(--chart-2)" radius={[8, 8, 8, 8]} />
              <Bar dataKey="collected" fill="var(--chart-1)" radius={[8, 8, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Collection rate</h3>
        <p className="text-sm text-muted-foreground">November invoices</p>
        <p className="mt-3 text-2xl font-semibold text-primary">{cedi(61300)}</p>
        <p className="text-sm text-muted-foreground">6% better than October</p>
        <div className="relative mx-auto mt-4 w-44">
          <svg viewBox="0 0 100 55" className="w-full">
            <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="var(--muted)" strokeWidth="14" />
            <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="var(--primary)" strokeWidth="14" pathLength={100} strokeDasharray={`${pct} 100`} />
          </svg>
          <p className="absolute inset-x-0 bottom-0 text-center text-2xl font-semibold">{pct}%</p>
        </div>
      </Card>

      <Card className="flex flex-col items-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gold-soft text-xl font-semibold text-gold">KM</div>
        <h3 className="mt-3 text-lg font-semibold">Kofi Mensah</h3>
        <p className="text-sm text-muted-foreground">kofi.mensah@gmail.com</p>
        <div className="mt-5 grid w-full grid-cols-3">
          {[["Properties", 5], ["Units", 40], ["Tenants", 36]].map(([l, v]) => (
            <div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold">{v}</p></div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Recent payments</h3><Link to="/payments" className="flex items-center gap-1 text-sm font-semibold text-primary">View all<ArrowUpRight className="h-4 w-4" /></Link></div>
        <div className="mt-4 space-y-4">
          {payments.slice(0, 4).map((p) => (
            <div key={p.ref} className="flex items-center justify-between border-l-4 border-primary pl-3">
              <div><p className="font-semibold">{p.tenant}</p><p className="text-xs text-muted-foreground">{p.method} · {p.date}</p></div>
              <Badge tone="green">+{cedi(p.amount)}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Maintenance</h3><Wrench className="h-4 w-4 text-muted-foreground" /></div>
        <div className="mt-4 space-y-3">
          {maintenance.slice(0, 3).map((m) => (
            <div key={m.title}><p className="text-sm font-semibold">{m.title}</p><div className="mt-1 flex items-center justify-between"><span className="text-xs text-muted-foreground">{m.unit}</span><Badge tone={m.status === "Resolved" ? "green" : m.priority === "High" ? "red" : "gold"}>{m.status}</Badge></div></div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center text-center">
        <Smartphone className="h-12 w-12 text-primary" strokeWidth={1.5} />
        <h3 className="mt-3 text-lg font-semibold">Get paid by MoMo</h3>
        <p className="text-sm text-muted-foreground">Let tenants pay rent with MTN, Telecel or AirtelTigo and get instant receipts.</p>
        <Button className="mt-4">Set up MoMo</Button>
      </Card>

      <Card className="lg:col-span-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary"><Megaphone className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1"><p className="font-semibold">{announcements[0]!.title}</p><p className="truncate text-sm text-muted-foreground">{announcements[0]!.body}</p></div>
          <Link to="/announcements" className="text-sm font-semibold text-primary">All announcements</Link>
        </div>
      </Card>
    </div>
  );
}
