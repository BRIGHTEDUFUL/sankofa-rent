import { createFileRoute } from "@tanstack/react-router";
import { DataPage } from "@/components/app/DataPage";
import { Badge, cedi } from "@/components/app/AppShell";
import * as data from "@/lib/mock";
import { Download } from "lucide-react";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payments & receipts — Nyumba Rent" }, { name: "description", content: "Record mobile money, bank and cash payments and issue receipts." }, { property: "og:title", content: "Payments & receipts — Nyumba Rent" }, { property: "og:description", content: "Record mobile money, bank and cash payments and issue receipts." }] }),
  component: Page,
});


function Page() {
  return <DataPage title="Payments & receipts" subtitle="Every cedi received, with a receipt" action="Record payment" rows={data.payments}
    stats={[{ label: "This month", value: cedi(61300) }, { label: "Mobile money", value: "72%" }, { label: "Bank transfer", value: "19%" }, { label: "Cash", value: "9%" }]}
    columns={[
      { key: "r", label: "Receipt", render: (r) => <span className="font-mono text-xs font-semibold">{r.ref}</span> },
      { key: "t", label: "From", render: (r) => <div className="border-l-4 border-primary pl-3"><p className="font-semibold">{r.tenant}</p><p className="text-xs text-muted-foreground">{r.date}</p></div> },
      { key: "m", label: "Method", render: (r) => <Badge>{r.method}</Badge> },
      { key: "a", label: "Amount", render: (r) => <span className="font-semibold text-success">+{cedi(r.amount)}</span> },
      { key: "d", label: "", className: "text-right", render: () => <button className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-accent"><Download className="h-3.5 w-3.5" />Receipt</button> },
    ]} />;
}
