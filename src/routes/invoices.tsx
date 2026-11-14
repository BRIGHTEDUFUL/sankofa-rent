import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { DataPage } from "@/components/app/DataPage";
import { Badge, Card } from "@/components/app/AppShell";
import { FormDialog, SelectField, TextField } from "@/components/app/FormDialog";
import {
  cediFromPesewas,
  formatDate,
  formatMonth,
  msFromDateInput,
  pesewasFromCedi,
  friendlyError,
} from "@/lib/format";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "Rent invoices — Sankofa Rent" },
      { name: "description", content: "Create and send rent invoices to tenants." },
      { property: "og:title", content: "Rent invoices — Sankofa Rent" },
      { property: "og:description", content: "Create and send rent invoices to tenants." },
    ],
  }),
  component: Page,
});

type InvoiceRow = Doc<"invoices">;

const tone: Record<string, "green" | "red" | "gold" | "gray"> = {
  draft: "gray",
  sent: "gray",
  partial: "gold",
  paid: "green",
  overdue: "red",
};

export function Page() {
  const invoices = useQuery(api.invoices.list, {});
  const tenants = useQuery(api.tenants.list, {});
  const leases = useQuery(api.leases.list, {});
  const createInvoice = useMutation(api.invoices.create);
  const sendInvoice = useMutation(api.invoices.send);

  const [createOpen, setCreateOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  if (!invoices || !tenants || !leases) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="h-20 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  const tenantName = new Map(tenants.map((t) => [t._id, t.name]));
  const now = new Date();
  const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const cycle = invoices.filter((i) => i.period === currentPeriod);
  const invoiced = cycle.reduce((s, i) => s + i.amount, 0);
  const collected = cycle.reduce((s, i) => s + i.paid, 0);
  const overdue = cycle
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + (i.amount - i.paid), 0);
  const rate = invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0;

  const leaseOptions = leases
    .filter((l) => l.status !== "ended")
    .map((l) => ({
      value: l._id,
      label: `${tenantName.get(l.tenantId) ?? "Tenant"} · ${formatDate(l.start)} – ${formatDate(l.end)}`,
    }));

  async function submitCreate(values: FormData) {
    const leaseId = String(values.get("leaseId") || "") as Id<"leases">;
    const period = String(values.get("period") || "").trim();
    const dueDate = msFromDateInput(String(values.get("dueDate") || ""));
    const amount = pesewasFromCedi(String(values.get("amount") || ""));
    if (!leaseId) throw new Error("Select a lease.");
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error("Period must be YYYY-MM.");
    if (Number.isNaN(dueDate)) throw new Error("Enter a valid due date.");
    if (Number.isNaN(amount)) throw new Error("Enter a valid amount.");
    await createInvoice({ leaseId, period, dueDate, amount });
    setCreateOpen(false);
  }

  return (
    <>
      <div className="space-y-5">
        {actionError && (
          <p
            role="alert"
            className="rounded-xl bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive"
          >
            {actionError}
          </p>
        )}
        <DataPage
          title="Rent invoices"
          subtitle={`${formatMonth(currentPeriod)} billing cycle`}
          action="New invoice"
          onAction={() => setCreateOpen(true)}
          loading={false}
          stats={[
            { label: "Invoiced", value: cediFromPesewas(invoiced) },
            { label: "Collected", value: cediFromPesewas(collected) },
            {
              label: "Overdue",
              value: cediFromPesewas(overdue),
              hint: `${cycle.filter((i) => i.status === "overdue").length} overdue`,
            },
            { label: "Collection rate", value: `${rate}%` },
          ]}
          columns={[
            {
              key: "n",
              label: "Invoice",
              render: (r) => <span className="font-mono text-xs font-semibold">{r.number}</span>,
            },
            {
              key: "t",
              label: "Tenant",
              render: (r) => (
                <span className="font-semibold">{tenantName.get(r.tenantId) ?? "—"}</span>
              ),
            },
            { key: "p", label: "Period", render: (r) => formatMonth(r.period) },
            { key: "d", label: "Due", render: (r) => formatDate(r.dueDate) },
            {
              key: "a",
              label: "Amount",
              render: (r) => <span className="font-semibold">{cediFromPesewas(r.amount)}</span>,
            },
            {
              key: "s",
              label: "Status",
              render: (r) => <Badge tone={tone[r.status]}>{r.status}</Badge>,
            },
            {
              key: "act",
              label: "Actions",
              className: "text-right",
              render: (r) =>
                r.status === "draft" ? (
                  <button
                    onClick={() => {
                      setActionError("");
                      sendInvoice({ id: r._id }).catch((err: unknown) =>
                        setActionError(friendlyError(err, "Could not send the invoice.")),
                      );
                    }}
                    className="min-h-[44px] rounded-xl px-3 text-sm font-semibold text-primary hover:bg-muted sm:min-h-0 sm:rounded-full sm:px-2.5 sm:py-1"
                  >
                    Send
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {cediFromPesewas(r.paid)} paid
                  </span>
                ),
            },
          ]}
          rows={invoices}
        />
      </div>

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New invoice"
        onSubmit={submitCreate}
        submitLabel="Create invoice"
      >
        <SelectField
          label="Lease"
          name="leaseId"
          placeholder="Select a lease"
          options={leaseOptions}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="Period (YYYY-MM)" name="period" required placeholder={currentPeriod} />
          <TextField label="Due date" name="dueDate" type="date" required />
        </div>
        <TextField
          label="Amount (GH₵)"
          name="amount"
          required
          inputMode="decimal"
          placeholder="1,600"
        />
      </FormDialog>
    </>
  );
}
