import { createFileRoute } from "@tanstack/react-router";
import { DataPage } from "@/components/app/DataPage";
import { Badge, cedi } from "@/components/app/AppShell";
import * as data from "@/lib/mock";

export const Route = createFileRoute("/tenants")({
  head: () => ({ meta: [{ title: "Tenants — Nyumba Rent" }, { name: "description", content: "Keep track of every tenant, contact and balance." }, { property: "og:title", content: "Tenants — Nyumba Rent" }, { property: "og:description", content: "Keep track of every tenant, contact and balance." }] }),
  component: Page,
});


function Page() {
  return <DataPage title="Tenants" subtitle="36 active tenants" action="Add tenant" rows={data.tenants}
    stats={[{ label: "Active tenants", value: "36" }, { label: "With arrears", value: "3", hint: "GH₵ 7,100 outstanding" }, { label: "New this month", value: "2" }, { label: "Move-outs due", value: "1" }]}
    columns={[
      { key: "n", label: "Tenant", render: (r) => <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div><span className="font-semibold">{r.name}</span></div> },
      { key: "p", label: "Phone", render: (r) => r.phone },
      { key: "u", label: "Unit", render: (r) => r.unit },
      { key: "s", label: "Tenant since", render: (r) => r.since },
      { key: "b", label: "Balance", className: "text-right", render: (r) => r.balance ? <Badge tone="red">{cedi(r.balance)} owed</Badge> : <Badge tone="green">Up to date</Badge> },
    ]} />;
}
