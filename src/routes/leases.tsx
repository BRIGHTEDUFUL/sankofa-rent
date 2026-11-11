import { createFileRoute } from "@tanstack/react-router";
import { DataPage } from "@/components/app/DataPage";
import { Badge, cedi } from "@/components/app/AppShell";
import * as data from "@/lib/mock";

export const Route = createFileRoute("/leases")({
  head: () => ({ meta: [{ title: "Leases — Nyumba Rent" }, { name: "description", content: "Track lease terms, rent advances and renewals." }, { property: "og:title", content: "Leases — Nyumba Rent" }, { property: "og:description", content: "Track lease terms, rent advances and renewals." }] }),
  component: Page,
});


const tone = { Active: "green", Expiring: "gold", Ended: "gray" } as const;
function Page() {
  return <DataPage title="Leases" subtitle="Terms, advances and renewals" action="New lease" rows={data.leases}
    stats={[{ label: "Active leases", value: "34" }, { label: "Expiring in 60 days", value: "2" }, { label: "Avg. advance", value: "10 mo" }, { label: "Renewal rate", value: "86%" }]}
    columns={[
      { key: "t", label: "Tenant", render: (r) => <span className="font-semibold">{r.tenant}</span> },
      { key: "u", label: "Unit", render: (r) => r.unit },
      { key: "d", label: "Term", render: (r) => <span className="text-muted-foreground">{r.start} → {r.end}</span> },
      { key: "a", label: "Advance", render: (r) => r.advance },
      { key: "r", label: "Rent / mo", render: (r) => <span className="font-semibold">{cedi(r.rent)}</span> },
      { key: "s", label: "Status", className: "text-right", render: (r) => <Badge tone={tone[r.status as keyof typeof tone]}>{r.status}</Badge> },
    ]} />;
}
