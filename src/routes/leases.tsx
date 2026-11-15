import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { DataPage } from "@/components/app/DataPage";
import { Badge, Card } from "@/components/app/AppShell";
import { ConfirmDialog, FormDialog, SelectField, TextField } from "@/components/app/FormDialog";
import {
  cediFromPesewas,
  formatDate,
  msFromDateInput,
  pesewasFromCedi,
  plural,
} from "@/lib/format";

export const Route = createFileRoute("/leases")({
  head: () => ({
    meta: [
      { title: "Leases — Sankofa Rent" },
      { name: "description", content: "Terms, advances and renewals." },
      { property: "og:title", content: "Leases — Sankofa Rent" },
      { property: "og:description", content: "Terms, advances and renewals." },
    ],
  }),
  component: Page,
});

type LeaseRow = Doc<"leases">;

const tone = { active: "green", expiring: "gold", ended: "gray" } as const;

function Page() {
  const leases = useQuery(api.leases.list, {});
  const tenants = useQuery(api.tenants.list, {});
  const properties = useQuery(api.properties.list, {});
  const createLease = useMutation(api.leases.create);
  const renewLease = useMutation(api.leases.renew);
  const endLease = useMutation(api.leases.end);

  const [createOpen, setCreateOpen] = useState(false);
  const [createTenantId, setCreateTenantId] = useState("");
  const [renewing, setRenewing] = useState<LeaseRow | null>(null);
  const [ending, setEnding] = useState<LeaseRow | null>(null);

  if (!leases || !tenants || !properties) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="h-20 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  const tenantName = new Map(tenants.map((t) => [t._id, t.name]));
  const unitLabel = new Map<string, string>();
  for (const p of properties)
    for (const u of p.units) unitLabel.set(u._id, `${p.name} · ${u.label}`);
  // A tenant's pre-assigned unit is occupied but belongs to this lease flow —
  // offer it alongside genuinely vacant units so it can be papered over.
  const selectedTenantUnitId = createTenantId
    ? tenants.find((t) => t._id === createTenantId)?.unitId
    : undefined;
  const selectableUnits = properties.flatMap((p) =>
    p.units
      .filter((u) => u.status === "vacant" || u._id === selectedTenantUnitId)
      .map((u) => ({
        value: u._id,
        label:
          u._id === selectedTenantUnitId && u.status !== "vacant"
            ? `${p.name} · ${u.label} (their unit)`
            : `${p.name} · ${u.label}`,
      })),
  );

  async function submitCreate(values: FormData) {
    const tenantId = String(values.get("tenantId") || "") as Id<"tenants">;
    const unitId = String(values.get("unitId") || "") as Id<"units">;
    const start = msFromDateInput(String(values.get("start") || ""));
    const end = msFromDateInput(String(values.get("end") || ""));
    const rent = pesewasFromCedi(String(values.get("rent") || ""));
    const advanceMonths = Number(String(values.get("advanceMonths") || "0"));
    const depositRaw = String(values.get("deposit") || "").trim();
    if (!tenantId || !unitId) throw new Error("Select a tenant and a unit.");
    if (Number.isNaN(start) || Number.isNaN(end))
      throw new Error("Enter valid start and end dates.");
    if (end <= start) throw new Error("End date must be after the start date.");
    if (Number.isNaN(rent)) throw new Error("Enter a valid monthly rent.");
    if (!Number.isInteger(advanceMonths) || advanceMonths < 0)
      throw new Error("Advance months must be zero or more.");
    await createLease({
      tenantId,
      unitId,
      start,
      end,
      rent,
      advanceMonths,
      deposit: depositRaw ? pesewasFromCedi(depositRaw) : undefined,
    });
    setCreateOpen(false);
    setCreateTenantId("");
  }

  async function submitRenew(values: FormData) {
    if (!renewing) return;
    const end = msFromDateInput(String(values.get("end") || ""));
    const rentRaw = String(values.get("rent") || "").trim();
    const advanceRaw = String(values.get("advanceMonths") || "").trim();
    if (Number.isNaN(end)) throw new Error("Enter a valid end date.");
    if (end <= renewing.end) throw new Error("New end date must be after the current end date.");
    const rent = rentRaw ? pesewasFromCedi(rentRaw) : undefined;
    if (rent !== undefined && Number.isNaN(rent)) throw new Error("Enter a valid monthly rent.");
    const advanceMonths = advanceRaw ? Number(advanceRaw) : undefined;
    if (advanceMonths !== undefined && (!Number.isInteger(advanceMonths) || advanceMonths < 0))
      throw new Error("Advance months must be zero or more.");
    await renewLease({ id: renewing._id, end, rent, advanceMonths });
    setRenewing(null);
  }

  return (
    <>
      <DataPage
        title="Leases"
        subtitle={`${plural(leases.filter((l) => l.status === "active").length, "active lease")} · ${plural(leases.filter((l) => l.status === "expiring").length, "expiring lease")}`}
        action="New lease"
        onAction={() => setCreateOpen(true)}
        loading={false}
        columns={[
          {
            key: "t",
            label: "Tenant",
            render: (r) => (
              <span className="font-semibold">{tenantName.get(r.tenantId) ?? "—"}</span>
            ),
          },
          { key: "u", label: "Unit", render: (r) => unitLabel.get(r.unitId) ?? "—" },
          { key: "s", label: "Start", render: (r) => formatDate(r.start) },
          { key: "e", label: "End", render: (r) => formatDate(r.end) },
          {
            key: "r",
            label: "Rent",
            render: (r) => <span className="font-semibold">{cediFromPesewas(r.rent)}</span>,
          },
          { key: "a", label: "Advance", render: (r) => `${r.advanceMonths} mo` },
          {
            key: "st",
            label: "Status",
            render: (r) => <Badge tone={tone[r.status]}>{r.status}</Badge>,
          },
          {
            key: "act",
            label: "Actions",
            className: "text-right",
            render: (r) => (
              <div className="flex justify-end gap-1">
                {r.status !== "ended" && (
                  <button
                    onClick={() => setRenewing(r)}
                    aria-label={`Renew lease for ${tenantName.get(r.tenantId) ?? "tenant"}`}
                    className="min-h-[44px] rounded-xl px-3 text-sm font-semibold text-primary hover:bg-muted sm:min-h-0 sm:rounded-full sm:px-2.5 sm:py-1 pressable"
                  >
                    Renew
                  </button>
                )}
                {r.status !== "ended" && (
                  <button
                    onClick={() => setEnding(r)}
                    aria-label={`End lease for ${tenantName.get(r.tenantId) ?? "tenant"}`}
                    className="min-h-[44px] rounded-xl px-3 text-sm font-semibold text-destructive hover:bg-destructive-soft sm:min-h-0 sm:rounded-full sm:px-2.5 sm:py-1 pressable"
                  >
                    End
                  </button>
                )}
              </div>
            ),
          },
        ]}
        rows={leases}
      />

      <FormDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateTenantId("");
        }}
        title="New lease"
        onSubmit={submitCreate}
        submitLabel="Create lease"
      >
        <SelectField
          label="Tenant"
          name="tenantId"
          placeholder="Select a tenant"
          options={tenants.map((t) => ({ value: t._id, label: t.name }))}
          onValueChange={setCreateTenantId}
        />
        <SelectField
          label="Unit"
          name="unitId"
          placeholder="Select a unit"
          options={selectableUnits}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="Start date" name="start" type="date" required />
          <TextField label="End date" name="end" type="date" required />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Monthly rent (GH₵)"
            name="rent"
            required
            inputMode="decimal"
            placeholder="1,600"
          />
          <TextField
            label="Advance (months)"
            name="advanceMonths"
            type="number"
            min={0}
            defaultValue="0"
          />
        </div>
        <TextField
          label="Deposit (GH₵)"
          name="deposit"
          inputMode="decimal"
          placeholder="Optional"
        />
      </FormDialog>

      <FormDialog
        open={!!renewing}
        onOpenChange={(o) => !o && setRenewing(null)}
        title="Renew lease"
        onSubmit={submitRenew}
        submitLabel="Renew lease"
      >
        <TextField
          label="New end date"
          name="end"
          type="date"
          required
          defaultValue={renewing ? new Date(renewing.end).toISOString().slice(0, 10) : ""}
        />
        <TextField
          label="New monthly rent (GH₵)"
          name="rent"
          inputMode="decimal"
          defaultValue={renewing ? String(renewing.rent / 100) : ""}
        />
        <TextField
          label="Advance (months)"
          name="advanceMonths"
          type="number"
          min={0}
          defaultValue={renewing ? String(renewing.advanceMonths) : "0"}
        />
      </FormDialog>

      <ConfirmDialog
        open={!!ending}
        onOpenChange={(o) => !o && setEnding(null)}
        title="End lease"
        message="End this lease and mark the unit as vacant? This cannot be undone."
        confirming="End lease"
        onConfirm={async () => {
          if (ending) {
            await endLease({ id: ending._id });
            setEnding(null);
          }
        }}
      />
    </>
  );
}
