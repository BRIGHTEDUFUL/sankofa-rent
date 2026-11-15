import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Pin, Trash2, Plus, ExternalLink, Copy, Check } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Card, Badge, Button } from "@/components/app/AppShell";
import { ConfirmDialog, FormDialog, SelectField, TextField } from "@/components/app/FormDialog";
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

function Page() {
  const announcements = useQuery(api.announcements.list, {});
  const properties = useQuery(api.properties.list, {});
  const createAnnouncement = useMutation(api.announcements.create);
  const togglePin = useMutation(api.announcements.togglePin);
  const removeAnnouncement = useMutation(api.announcements.remove);

  const [createOpen, setCreateOpen] = useState(false);
  const [removing, setRemoving] = useState<AnnouncementRow | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  async function copyNoticeBoardLink() {
    try {
      const url = `${window.location.origin}/notices`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // fallback
    }
  }

  async function submit(values: FormData) {
    const title = String(values.get("title") || "").trim();
    const body = String(values.get("body") || "").trim();
    const propertyRaw = String(values.get("propertyId") || "none");
    const pinned = values.has("pinned");
    if (!title || !body) throw new Error("Title and message are required.");
    await createAnnouncement({
      title,
      body,
      propertyId: propertyRaw === "none" ? undefined : (propertyRaw as Id<"properties">),
      pinned,
      channels: ["in_app"],
    });
    setCreateOpen(false);
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Announcements</h2>
            <p className="text-sm text-muted-foreground">
              {announcements.length} {announcements.length === 1 ? "notice" : "notices"} published
              to your tenants
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyNoticeBoardLink}
              className="inline-flex h-11 sm:h-9 items-center gap-1.5 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm font-semibold text-foreground transition hover:bg-muted pressable"
              title="Copy the public notice board URL to share with tenants"
            >
              {copiedLink ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
              {copiedLink ? "Link copied!" : "Copy tenant notice link"}
            </button>
            <Link
              to="/notices"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 sm:h-9 items-center gap-1.5 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm font-semibold text-foreground transition hover:bg-muted pressable"
              title="Open the public tenant notice board"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              View notice board
            </Link>
            <Button
              className="h-11 sm:h-9 w-full sm:w-auto justify-center"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New announcement
            </Button>
          </div>
        </div>

        {/* In-app notice delivery banner */}
        <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4 text-xs sm:text-sm text-foreground">
          <p className="font-semibold text-primary">In-app notice board active</p>
          <p className="mt-0.5 text-muted-foreground">
            Notices published here appear immediately on the in-app Tenant Notice Board at{" "}
            <span className="font-mono text-xs font-semibold">/notices</span>. Tenants can view them
            without requiring third-party SMS, WhatsApp, or email subscriptions.
          </p>
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
                    <Badge tone="green">In-app</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
                    {a.body}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {a.propertyId
                        ? (propertyName.get(a.propertyId) ?? "Property")
                        : "All properties"}
                    </span>
                    <span>·</span>
                    <span>{formatDate(a._creationTime)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => togglePin({ id: a._id })}
                    className="grid h-10 w-10 sm:h-8 sm:w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted pressable"
                    title={a.pinned ? "Unpin announcement" : "Pin announcement"}
                    aria-label={
                      a.pinned ? `Unpin announcement ${a.title}` : `Pin announcement ${a.title}`
                    }
                  >
                    <Pin className={`h-4 w-4 ${a.pinned ? "text-primary fill-primary" : ""}`} />
                  </button>
                  <button
                    onClick={() => setRemoving(a)}
                    className="grid h-10 w-10 sm:h-8 sm:w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive pressable"
                    title="Delete announcement"
                    aria-label={`Delete announcement ${a.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New announcement"
        onSubmit={submit}
        submitLabel="Publish notice"
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
            className="w-full min-h-[6rem] rounded-lg border border-input bg-transparent px-3 py-2.5 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
          />
        </div>
        <SelectField
          label="Target audience"
          name="propertyId"
          defaultValue="none"
          options={[
            { value: "none", label: "All properties" },
            ...properties.map((p) => ({ value: p._id, label: p.name })),
          ]}
        />
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              name="pinned"
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span>Pin to top as urgent / important notice</span>
          </label>
          <p className="text-xs text-muted-foreground">
            This notice publishes directly to the in-app Tenant Notice Board. No external SMS or
            WhatsApp services required.
          </p>
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
