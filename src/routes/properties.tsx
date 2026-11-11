import { createFileRoute } from "@tanstack/react-router";
import { Building2, MapPin } from "lucide-react";
import { Card, cedi } from "@/components/app/AppShell";
import { Button } from "@/components/app/AppShell";
import { Plus } from "lucide-react";
import { properties } from "@/lib/mock";

export const Route = createFileRoute("/properties")({
  head: () => ({ meta: [{ title: "Properties & units — Nyumba Rent" }, { name: "description", content: "Manage your properties and rental units across Ghana." }, { property: "og:title", content: "Properties & units — Nyumba Rent" }, { property: "og:description", content: "Manage your properties and rental units across Ghana." }] }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-2xl font-semibold tracking-tight">Properties & units</h2><p className="text-sm text-muted-foreground">5 properties · 40 units</p></div>
        <Button><Plus className="h-4 w-4" />Add property</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((p) => {
          const pct = Math.round((p.occupied / p.units) * 100);
          return (
            <Card key={p.name}>
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary"><Building2 className="h-5 w-5" /></div>
                <span className="text-xs font-semibold text-muted-foreground">{p.units} units</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{p.name}</h3>
              <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{p.area}</p>
              <div className="mt-5 flex justify-between text-sm"><span className="text-muted-foreground">Occupancy</span><span className="font-semibold">{p.occupied}/{p.units} · {pct}%</span></div>
              <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-gradient-primary" style={{ width: pct + "%" }} /></div>
              <div className="mt-5 flex items-center justify-between border-t pt-4"><span className="text-sm text-muted-foreground">Monthly rent roll</span><span className="font-semibold">{cedi(p.rent)}</span></div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Array.from({ length: p.units }).map((_, i) => (
                  <span key={i} title={i < p.occupied ? "Occupied" : "Vacant"} className={`h-6 w-6 rounded-md ${i < p.occupied ? "bg-primary" : "border-2 border-dashed border-border"}`} />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
