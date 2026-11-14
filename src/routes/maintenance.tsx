import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { DataPage } from "@/components/app/DataPage";
import { Badge, Card } from "@/components/app/AppShell";
import { ResponsiveDialog } from "@/components/app/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { friendlyError } from "@/lib/format";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — Sankofa Rent" },
      { name: "description", content: "Requests from tenants and caretakers." },
      { property: "og:title", content: "Maintenance — Sankofa Rent" },
      { property: "og:description", content: "Requests from tenants and caretakers." },
    ],
  }),
  component: Page,
});

type MaintenanceRow = Doc<"maintenance">;

const priorityTone = { low: "gray", medium: "gold", high: "red" } as const;
const statusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};
const nextStatus = { open: "in_progress", in_progress: "resolved", resolved: "open" } as const;

export function Page() {
  const maintenance = useQuery(api.maintenance.list, {});
  const properties = useQuery(api.properties.list, {});
  const createMaintenance = useMutation(api.maintenance.create);
  const updateStatus = useMutation(api.maintenance.updateStatus);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRow | null>(null);

  if (!maintenance || !properties) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-20 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  const unitLabel = new Map<string, string>();
  for (const p of properties) for (const u of p.units) unitLabel.set(u._id, u.label);
  const propertyName = new Map(properties.map((p) => [p._id, p.name]));

  async function submit(values: {
    propertyId: Id<"properties">;
    unitId?: Id<"units">;
    title: string;
    description?: string;
    reportedBy: string;
    priority: string;
  }) {
    await createMaintenance({
      propertyId: values.propertyId,
      unitId: values.unitId,
      title: values.title,
      description: values.description,
      reportedBy: values.reportedBy,
      priority: values.priority as "low" | "medium" | "high",
    });
    setOpen(false);
  }

  async function saveStatus(values: { status: string; cost?: number }) {
    if (!editing) return;
    await updateStatus({
      id: editing._id,
      status: values.status as "open" | "in_progress" | "resolved",
      cost: values.cost,
    });
    setEditing(null);
  }

  return (
    <>
      <DataPage
        title="Maintenance"
        subtitle="Requests from tenants and caretakers"
        action="New request"
        onAction={() => setOpen(true)}
        loading={false}
        stats={[
          { label: "Open", value: String(maintenance.filter((m) => m.status === "open").length) },
          {
            label: "In progress",
            value: String(maintenance.filter((m) => m.status === "in_progress").length),
          },
          {
            label: "Resolved",
            value: String(maintenance.filter((m) => m.status === "resolved").length),
          },
          { label: "Total requests", value: String(maintenance.length) },
        ]}
        columns={[
          {
            key: "t",
            label: "Request",
            render: (r) => (
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {r.reportedBy} · {propertyName.get(r.propertyId) ?? "Property"}
                </p>
              </div>
            ),
          },
          {
            key: "u",
            label: "Unit",
            render: (r) => (r.unitId ? (unitLabel.get(r.unitId) ?? "All") : "All"),
          },
          {
            key: "p",
            label: "Priority",
            render: (r) => <Badge tone={priorityTone[r.priority]}>{r.priority}</Badge>,
          },
          {
            key: "s",
            label: "Status",
            render: (r) => (
              <Badge
                tone={
                  r.status === "resolved" ? "green" : r.status === "in_progress" ? "gold" : "red"
                }
              >
                {statusLabel[r.status]}
              </Badge>
            ),
          },
          {
            key: "act",
            label: "Actions",
            className: "text-right",
            render: (r) => (
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setEditing(r)}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold text-primary hover:bg-muted"
                >
                  Update
                </button>
                <button
                  onClick={() => updateStatus({ id: r._id, status: nextStatus[r.status] })}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  {nextStatus[r.status].replace("_", " ")}
                </button>
              </div>
            ),
          },
        ]}
        rows={maintenance}
      />

      <MaintenanceDialog
        open={open}
        onOpenChange={setOpen}
        properties={properties}
        onSubmit={submit}
      />
      <StatusDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        item={editing}
        onSubmit={saveStatus}
      />
    </>
  );
}

function MaintenanceDialog({
  open,
  onOpenChange,
  properties,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: (Doc<"properties"> & { units: Doc<"units">[]; occupied: number })[];
  onSubmit: (values: {
    propertyId: Id<"properties">;
    unitId?: Id<"units">;
    title: string;
    description?: string;
    reportedBy: string;
    priority: string;
  }) => Promise<void>;
}) {
  const [propertyId, setPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [unitId, setUnitId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const property = properties.find((p) => p._id === propertyId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!propertyId) {
      setError("Select a property.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!reportedBy.trim()) {
      setError("Reported by is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        propertyId: propertyId as Id<"properties">,
        unitId: unitId ? (unitId as Id<"units">) : undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        reportedBy: reportedBy.trim(),
        priority,
      });
      setPropertyId("");
      setTitle("");
      setDescription("");
      setReportedBy("");
      setUnitId("");
      setPriority("medium");
    } catch (err) {
      setError(friendlyError(err, "Could not create the request."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setError("");
      }}
      title="New maintenance request"
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leaking kitchen tap"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened?"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Property</Label>
          <Select
            value={propertyId}
            onValueChange={(v) => {
              setPropertyId(v);
              setUnitId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Select value={unitId} onValueChange={setUnitId} disabled={!property}>
              <SelectTrigger>
                <SelectValue placeholder="Whole property" />
              </SelectTrigger>
              <SelectContent>
                {property?.units.map((u) => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Reported by</Label>
          <Input
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
            placeholder="Tenant or caretaker"
          />
        </div>
        {error && (
          <p className="border-l-2 border-destructive pl-3 text-sm text-destructive">{error}</p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full justify-center sm:h-auto sm:w-auto"
          >
            {submitting ? "Saving…" : "Create request"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}

function StatusDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MaintenanceRow | null;
  onSubmit: (values: { status: string; cost?: number }) => Promise<void>;
}) {
  const [status, setStatus] = useState<string>(item?.status ?? "open");
  const [cost, setCost] = useState(item?.cost ? String(item.cost / 100) : "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const pesewas = cost.trim() ? Number(cost) * 100 : undefined;
    if (pesewas !== undefined && (!Number.isSafeInteger(pesewas) || pesewas < 0)) {
      setError("Enter a valid cost.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ status, cost: pesewas });
    } catch (err) {
      setError(friendlyError(err, "Could not save."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setError("");
      }}
      title="Update request"
      className="sm:max-w-md"
    >
      <form className="space-y-4" onSubmit={submit}>
        <p className="text-sm text-muted-foreground">{item?.title}</p>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cost">Cost (GH₵)</Label>
          <Input
            id="cost"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            inputMode="decimal"
            placeholder="Optional"
          />
        </div>
        {error && (
          <p className="border-l-2 border-destructive pl-3 text-sm text-destructive">{error}</p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full justify-center sm:h-auto sm:w-auto"
          >
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
