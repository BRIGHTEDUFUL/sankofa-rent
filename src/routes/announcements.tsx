import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pin, Trash2, Plus } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Card, Badge, Button } from "@/components/app/AppShell";
import { ConfirmDialog, FormDialog, TextField } from "@/components/app/FormDialog";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Sankofa Rent" },
      { name: "description", content: "Send notices to your tenants." },
      { property: "og:title", content: "Announcements — Sankofa Rent" },
      { property: "og:description", content: "Send notices to your tenants." },
    ],
  }),
  component: Page,
});

type AnnouncementRow = Doc<"announcements">;

const channels = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
];

export function Page() {
  const announcements = useQuery(api.announcements.list, {});
  const properties = useQuery(api.properties.list, {});
  const createAnnouncement = useMutation(api.announcements.create);
  const togglePin = useMutation(api.announcements.togglePin);
  const removeAnnouncement = useMutation(api.announcements.remove);

  const [createOpen, setCreateOpen] = useState(false);
  const [removing, setRemoving] = useState<AnnouncementRow | null>(null);

  if (!announcements || !properties) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-28 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  const propertyName = new Map(properties.map((p) => [p._id, p.name]));

  async function submit(values: FormData) {
    const title = String(values.get("title") || "").trim();
    const body = String(values.get("body") || "").trim();
    const propertyRaw = String(values.get("propertyId") || "none");
    const selected = channels.filter((c) => values.has(`channel_${c.value}`)).map((c) => c.value);
    if (!title || !body) throw new Error("Title and message are required.");
    if (selected.length === 0) throw new Error("Choose at least one channel.");
    await createAnnouncement({
      title,
      body,
      propertyId: propertyRaw === "none" ? undefined : (propertyRaw as Id<"properties">),
      channels: selected as ("sms" | "email" | "whatsapp")[],
    });
    setCreateOpen(false);
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Announcements</h2>
          <p className="text-sm text-muted-foreground">
            {announcements.length} {announcements.length === 1 ? "notice" : "notices"} sent to your
            tenants
          </p>
        </div>
        <Button
          className="h-12 w-full justify-center sm:h-auto sm:w-auto sm:justify-start"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New announcement
        </Button>
      </div>

      {announcements.length === 0 && (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          No announcements yet. Send one to keep tenants informed.
        </Card>
      )}

      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a._id} className={a.pinned ? "border border-primary/30" : ""}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  {a.pinned && <Badge tone="gold">Pinned</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{a.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {a.propertyId
                      ? (propertyName.get(a.propertyId) ?? "Property")
                      : "All properties"}
                  </span>
                  <span>·</span>
                  <span>{formatDate(a._creationTime)}</span>
                  {a.channels.map((c) => (
                    <Badge key={c} tone="gray">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => togglePin({ id: a._id })}
                  className="grid h-10 w-10 sm:h-8 sm:w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                  title={a.pinned ? "Unpin" : "Pin"}
                >
                  <Pin className={`h-4 w-4 ${a.pinned ? "text-primary" : ""}`} />
                </button>
                <button
                  onClick={() => setRemoving(a)}
                  className="grid h-10 w-10 sm:h-8 sm:w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New announcement"
        onSubmit={submit}
        submitLabel="Send announcement"
      >
        <TextField label="Title" name="title" required placeholder="Water supply interruption" />
        <div className="space-y-1.5">
          <label htmlFor="body" className="text-sm font-medium">
            Message
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={4}
            placeholder="GWCL works on Saturday 14 Nov, 8am–4pm. Please store water ahead."
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Send to</label>
          <select
            name="propertyId"
            defaultValue="none"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:ring-1 focus:ring-ring"
          >
            <option value="none">All properties</option>
            {properties.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Channels</span>
          <div className="flex flex-wrap gap-3">
            {channels.map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`channel_${c.value}`}
                  defaultChecked={c.value === "sms"}
                  className="h-4 w-4 accent-primary"
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Delete announcement"
        message={`Delete "${removing?.title ?? "this announcement"}"? This cannot be undone.`}
        confirming="Delete"
        onConfirm={async () => {
          if (removing) {
            await removeAnnouncement({ id: removing._id });
            setRemoving(null);
          }
        }}
      />
    </>
  );
}
