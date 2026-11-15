import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Archive } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { DataPage } from "@/components/app/DataPage";
import { Badge, Card } from "@/components/app/AppShell";
import { ConfirmDialog, FormDialog, SelectField, TextField } from "@/components/app/FormDialog";
import { cediFromPesewas, formatDate, initials, plural } from "@/lib/format";

export const Route = createFileRoute("/tenants")({
  head: () => ({
    meta: [
      { title: "Tenants — Sankofa Rent" },
      { name: "description", content: "Keep track of every tenant, contact and balance." },
      { property: "og:title", content: "Tenants — Sankofa Rent" },
      { property: "og:description", content: "Keep track of every tenant, contact and balance." },
    ],
  }),
  component: Page,
});

type TenantRow = Doc<"tenants"> & { balance: number };

function Page() {
  const tenants = useQuery(api.tenants.list, {});
  const properties = useQuery(api.properties.list, {});
  const createTenant = useMutation(api.tenants.create);
  const updateTenant = useMutation(api.tenants.update);
  const archiveTenant = useMutation(api.tenants.archive);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<TenantRow | null>(null);
  const [archiving, setArchiving] = useState<TenantRow | null>(null);

  if (!tenants || !properties) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="h-20 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  const unitLabel = new Map<string, string>();
  for (const p of properties) {
    for (const u of p.units) unitLabel.set(u._id, `${p.name} · ${u.label}`);
  }
  const vacantUnits = properties.flatMap((p) =>
    p.units
      .filter((u) => u.status === "vacant")
      .map((u) => ({ value: u._id, label: `${p.name} · ${u.label}` })),
  );
  const currentUnit = editing?.unitId
    ? [{ value: editing.unitId, label: unitLabel.get(editing.unitId) ?? "Current unit" }]
    : [];
  const unitOptions = [
    ...currentUnit,
    ...vacantUnits.filter((v) => v.value !== editing?.unitId),
    { value: "none", label: "No unit" },
  ];

  const withArrears = tenants.filter((t) => t.balance > 0);
  const now = new Date();
  const newThisMonth = tenants.filter((t) => {
    const d = new Date(t.since);
    return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
  }).length;

  async function submitCreate(values: FormData) {
    const name = String(values.get("name") || "").trim();
    const phone = String(values.get("phone") || "").trim();
    const email = String(values.get("email") || "").trim();
    const unitRaw = String(values.get("unitId") || "none");
    if (!name || !phone) throw new Error("Name and phone are required.");
    await createTenant({
      name,
      phone,
      email: email || undefined,
      unitId: unitRaw === "none" ? undefined : (unitRaw as Id<"units">),
    });
    setCreateOpen(false);
  }

  async function submitEdit(values: FormData) {
    if (!editing) return;
    const name = String(values.get("name") || "").trim();
    const phone = String(values.get("phone") || "").trim();
    const email = String(values.get("email") || "").trim();
    const emergencyContact = String(values.get("emergencyContact") || "").trim();
    const ghanaCardNo = String(values.get("ghanaCardNo") || "").trim();
    if (!name || !phone) throw new Error("Name and phone are required.");
    await updateTenant({
      id: editing._id,
      name,
      phone,
      email: email || undefined,
      emergencyContact: emergencyContact || undefined,
      ghanaCardNo: ghanaCardNo || undefined,
    });
    setEditing(null);
  }

  return (
    <>
      <DataPage
        title="Tenants"
        subtitle={plural(tenants.length, "active tenant")}
        action="Add tenant"
        onAction={() => setCreateOpen(true)}
        loading={false}
        stats={[
          { label: "Active tenants", value: String(tenants.length) },
          {
            label: "With arrears",
            value: String(withArrears.length),
            hint: `${cediFromPesewas(withArrears.reduce((s, t) => s + t.balance, 0))} outstanding`,
          },
          { label: "New this month", value: String(newThisMonth) },
          {
            label: "Total arrears",
            value: cediFromPesewas(withArrears.reduce((s, t) => s + t.balance, 0)),
          },
        ]}
        columns={[
          {
            key: "n",
            label: "Tenant",
            render: (r) => (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                  {initials(r.name)}
                </div>
                <span className="font-semibold">{r.name}</span>
              </div>
            ),
          },
          { key: "p", label: "Phone", render: (r) => r.phone },
          {
            key: "u",
            label: "Unit",
            render: (r) => (r.unitId ? (unitLabel.get(r.unitId) ?? "—") : "—"),
          },
          { key: "s", label: "Tenant since", render: (r) => formatDate(r.since) },
          {
            key: "b",
            label: "Balance",
            className: "text-right",
            render: (r) =>
              r.balance > 0 ? (
                <Badge tone="red">{cediFromPesewas(r.balance)} owed</Badge>
              ) : (
                <Badge tone="green">Up to date</Badge>
              ),
          },
          {
            key: "a",
            label: "Actions",
            className: "text-right",
            render: (r) => (
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setEditing(r)}
                  className="grid h-10 w-10 sm:h-8 sm:w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                  title="Edit tenant"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setArchiving(r)}
                  className="grid h-10 w-10 sm:h-8 sm:w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                  title="Archive tenant"
                >
                  <Archive className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]}
        rows={tenants}
      />

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add tenant"
        onSubmit={submitCreate}
        submitLabel="Add tenant"
      >
        <TextField label="Full name" name="name" required placeholder="Ama Owusu" />
        <TextField label="Phone" name="phone" type="tel" required placeholder="024 512 3381" />
        <TextField label="Email" name="email" type="email" placeholder="ama@example.com" />
        <SelectField label="Unit" name="unitId" options={unitOptions} placeholder="No unit" />
      </FormDialog>

      <FormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit tenant"
        onSubmit={submitEdit}
        submitLabel="Save changes"
      >
        <TextField label="Full name" name="name" required defaultValue={editing?.name} />
        <TextField label="Phone" name="phone" type="tel" required defaultValue={editing?.phone} />
        <TextField label="Email" name="email" type="email" defaultValue={editing?.email ?? ""} />
        <TextField
          label="Emergency contact"
          name="emergencyContact"
          defaultValue={editing?.emergencyContact ?? ""}
          placeholder="024 000 0000"
        />
        <TextField
          label="Ghana Card number"
          name="ghanaCardNo"
          defaultValue={editing?.ghanaCardNo ?? ""}
          placeholder="GHA-000000000-0"
        />
      </FormDialog>

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(o) => !o && setArchiving(null)}
        title="Archive tenant"
        message={`Archive ${archiving?.name ?? "this tenant"}? They will be hidden from the active list.`}
        confirming="Archive"
        onConfirm={async () => {
          if (archiving) {
            await archiveTenant({ id: archiving._id });
            setArchiving(null);
          }
        }}
      />
    </>
  );
}
