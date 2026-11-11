import { createFileRoute } from "@tanstack/react-router";
import { DataPage } from "@/components/app/DataPage";
import { Badge, cedi } from "@/components/app/AppShell";
import * as data from "@/lib/mock";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Rent invoices — Nyumba Rent" }, { name: "description", content: "Create and send rent invoices to tenants." }, { property: "og:title", content: "Rent invoices — Nyumba Rent" }, { property: "og:description", content: "Create and send rent invoices to tenants." }] }),
  component: Page,
});


const tone = { Paid: "green", Overdue: "red", Partial: "gold", Sent: "gray" } as const;
function Page() {
  return <DataPage title="Rent invoices" subtitle="November 2026 billing cycle" action="Generate invoices" rows={data.invoices}
    stats={[{ label: "Invoiced", value: cedi(68500) }, { label: "Collected", value: cedi(61300) }, { label: "Overdue", value: cedi(3900), hint: "2 invoices" }, { label: "Collection rate", value: "89%" }]}
    columns={[
      { key: "n", label: "Invoice", render: (r) => <span className="font-mono text-xs font-semibold">{r.no}</span> },
      { key: "t", label: "Tenant", render: (r) => <span className="font-semibold">{r.tenant}</span> },
      { key: "p", label: "Period", render: (r) => r.period },
      { key: "d", label: "Due", render: (r) => r.due },
      { key: "a", label: "Amount", render: (r) => <span className="font-semibold">{cedi(r.amount)}</span> },
      { key: "s", label: "Status", className: "text-right", render: (r) => <Badge tone={tone[r.status as keyof typeof tone]}>{r.status}</Badge> },
    ]} />;
}
