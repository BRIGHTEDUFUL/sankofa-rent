import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Pin, Plus } from "lucide-react";
import { Badge, Button, Card } from "@/components/app/AppShell";
import { announcements } from "@/lib/mock";

export const Route = createFileRoute("/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Nyumba Rent" }, { name: "description", content: "Broadcast notices to tenants by property." }, { property: "og:title", content: "Announcements — Nyumba Rent" }, { property: "og:description", content: "Broadcast notices to tenants by property." }] }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-2xl font-semibold tracking-tight">Announcements</h2><p className="text-sm text-muted-foreground">Notices sent to tenants by SMS and app</p></div>
        <Button><Plus className="h-4 w-4" />New announcement</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.title}>
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><Megaphone className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{a.title}</h3>{a.pinned && <Badge tone="gold"><Pin className="mr-1 h-3 w-3" />Pinned</Badge>}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                  <div className="mt-3 flex gap-2 text-xs text-muted-foreground"><Badge>{a.to}</Badge><span className="self-center">{a.date}</span></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="h-fit">
          <h3 className="font-semibold">Quick notice</h3>
          <p className="text-sm text-muted-foreground">Send to all tenants at once</p>
          <input placeholder="Title" className="mt-4 w-full rounded-xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <textarea rows={4} placeholder="Write your message…" className="mt-3 w-full resize-none rounded-xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <Button className="mt-3 w-full justify-center">Send announcement</Button>
        </Card>
      </div>
    </div>
  );
}
