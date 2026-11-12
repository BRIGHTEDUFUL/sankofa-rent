import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Building, Bell, CreditCard, ShieldCheck, Users } from "lucide-react";
import { Badge, Button, Card } from "@/components/app/AppShell";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Nyumba Rent" }, { name: "description", content: "Manage your profile, business, notifications, payments and team." }, { property: "og:title", content: "Settings — Nyumba Rent" }, { property: "og:description", content: "Manage your profile, business, notifications, payments and team." }] }),
  component: Page,
});

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "business", label: "Business", icon: Building },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "payments", label: "Payment methods", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;
type Tab = (typeof tabs)[number]["id"];

function Input({ label, value, type = "text" }: { label: string; value?: string; type?: string }) {
  return (
    <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input type={type} defaultValue={value} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
  );
}
function Toggle({ label, hint, on = false }: { label: string; hint: string; on?: boolean }) {
  const [v, setV] = useState(on);
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0 [&>*:first-child]:min-w-0">
      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{hint}</p></div>
      <button type="button" onClick={() => setV(!v)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${v ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-soft transition-all ${v ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return <Card><h3 className="text-lg font-semibold">{title}</h3><p className="mb-5 text-sm text-muted-foreground">{desc}</p>{children}</Card>;
}

function Page() {
  const [tab, setTab] = useState<Tab>("profile");
  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-semibold tracking-tight">Settings</h2><p className="text-sm text-muted-foreground">Manage your account and how Nyumba Rent works for you</p></div>
      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit !p-2">
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] lg:flex-col">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${tab === t.id ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </nav>
        </Card>
        <div className="space-y-5">
          {tab === "profile" && (
            <Section title="Profile" desc="Your personal details">
              <div className="mb-6 flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-full bg-ink text-lg font-semibold text-ink-foreground">KM</div><Button variant="ghost">Change photo</Button></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="First name" value="Kofi" /><Input label="Last name" value="Mensah" />
                <Input label="Email" value="kofi.mensah@example.com" type="email" /><Input label="Phone" value="024 123 4567" />
              </div>
              <div className="mt-6 flex justify-end"><Button>Save changes</Button></div>
            </Section>
          )}
          {tab === "business" && (
            <Section title="Business details" desc="Shown on invoices and receipts">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Business name" value="Mensah Properties" /><Input label="GPS address" value="GA-183-8164" />
                <Input label="City" value="Accra" /><Input label="Currency" value="GH₵ Ghana cedi" />
                <Input label="Rent due day" value="1st of the month" /><Input label="Late fee (%)" value="5" />
              </div>
              <div className="mt-6 flex justify-end"><Button>Save changes</Button></div>
            </Section>
          )}
          {tab === "notifications" && (
            <Section title="Notifications" desc="Choose what you and your tenants are told about">
              <Toggle label="Rent reminders to tenants" hint="SMS 3 days before rent is due" on />
              <Toggle label="Overdue alerts" hint="Notify me when a tenant is late" on />
              <Toggle label="Payment received" hint="Get a message when money comes in" on />
              <Toggle label="New maintenance requests" hint="Alerts when a tenant reports a problem" on />
              <Toggle label="Lease expiry warnings" hint="60 days before a lease ends" />
              <Toggle label="Weekly summary email" hint="Every Monday morning" />
            </Section>
          )}
          {tab === "payments" && (
            <Section title="Payment methods" desc="Where your tenants pay rent">
              <div className="space-y-3">
                {[["MTN Mobile Money", "024 123 4567", true], ["Telecel Cash", "020 987 6543", false], ["GCB Bank", "•••• 4410", false]].map(([n, d, p]) => (
                  <div key={n as string} className="flex items-center justify-between rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><CreditCard className="h-5 w-5" /></div><div><p className="text-sm font-semibold">{n}</p><p className="text-xs text-muted-foreground">{d}</p></div></div>
                    {p ? <Badge tone="green">Primary</Badge> : <button className="text-xs font-semibold text-primary">Make primary</button>}
                  </div>
                ))}
              </div>
              <div className="mt-5"><Button variant="ghost">+ Add payment method</Button></div>
            </Section>
          )}
          {tab === "team" && (
            <Section title="Team" desc="People who help you manage properties">
              <div className="space-y-3">
                {([["Kofi Mensah", "Owner", "green"], ["Ama Owusu", "Caretaker · East Legon", "gold"], ["Yaw Boateng", "Accountant", "gray"]] as [string, string, string][]).map(([n, r, t]) => (
                  <div key={n} className="flex items-center justify-between rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-xs font-semibold">{n.split(" ").map((x) => x[0]).join("")}</div><p className="text-sm font-semibold">{n}</p></div>
                    <Badge tone={t as "green"}>{r}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-5"><Button>Invite member</Button></div>
            </Section>
          )}
          {tab === "security" && (
            <>
              <Section title="Change password" desc="Use at least 8 characters">
                <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Input label="Current password" type="password" /></div><Input label="New password" type="password" /><Input label="Confirm password" type="password" /></div>
                <div className="mt-6 flex justify-end"><Button>Update password</Button></div>
              </Section>
              <Section title="Extra protection" desc="Keep your account safe">
                <Toggle label="Two-step verification" hint="Code sent by SMS when you sign in" />
                <Toggle label="Sign-in alerts" hint="Tell me about new devices" on />
              </Section>
              <Card className="border border-destructive/30"><h3 className="font-semibold text-destructive">Delete account</h3><p className="mb-4 text-sm text-muted-foreground">This removes all properties, tenants and records.</p><button className="rounded-xl bg-destructive-soft px-4 py-2.5 text-sm font-semibold text-destructive">Delete account</button></Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
