import { createFileRoute } from "@tanstack/react-router";
import { DataPage } from "@/components/app/DataPage";
import { Badge, cedi } from "@/components/app/AppShell";
import * as data from "@/lib/mock";

export const Route = createFileRoute("/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — Nyumba Rent" }, { name: "description", content: "Log and resolve maintenance requests from tenants." }, { property: "og:title", content: "Maintenance — Nyumba Rent" }, { property: "og:description", content: "Log and resolve maintenance requests from tenants." }] }),
  component: Page,
});


const pr = { High: "red", Medium: "gold", Low: "gray" } as const;
const st = { Open: "red", "In progress": "gold", Resolved: "green" } as const;
function Page() {
  return <DataPage title="Maintenance" subtitle="Requests from tenants and caretakers" action="New request" rows={data.maintenance}
    stats={[{ label: "Open", value: "1" }, { label: "In progress", value: "2" }, { label: "Resolved (30d)", value: "9" }, { label: "Spend this month", value: cedi(2350) }]}
    columns={[
      { key: "t", label: "Issue", render: (r) => <span className="font-semibold">{r.title}</span> },
      { key: "u", label: "Unit", render: (r) => r.unit },
      { key: "r", label: "Reported by", render: (r) => <span className="text-muted-foreground">{r.reported} · {r.date}</span> },
      { key: "p", label: "Priority", render: (r) => <Badge tone={pr[r.priority as keyof typeof pr]}>{r.priority}</Badge> },
      { key: "s", label: "Status", className: "text-right", render: (r) => <Badge tone={st[r.status as keyof typeof st]}>{r.status}</Badge> },
    ]} />;
}
