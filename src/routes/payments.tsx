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
import {
  cediFromPesewas,
  formatDateTime,
  PAYMENT_METHODS,
  pesewasFromCedi,
  friendlyError,
} from "@/lib/format";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payments & receipts — Sankofa Rent" },
      {
        name: "description",
        content: "Record mobile money, bank and cash payments and issue receipts.",
      },
      { property: "og:title", content: "Payments & receipts — Sankofa Rent" },
      {
        property: "og:description",
        content: "Record mobile money, bank and cash payments and issue receipts.",
      },
    ],
  }),
  component: Page,
});

type PaymentRow = Doc<"payments">;
type InvoiceRow = Doc<"invoices">;

const methods = Object.entries(PAYMENT_METHODS).map(([value, label]) => ({ value, label }));

export function Page() {
  const payments = useQuery(api.payments.list, {});
  const tenants = useQuery(api.tenants.list, {});
  const invoices = useQuery(api.invoices.list, {});
  const recordPayment = useMutation(api.payments.record);

  const [open, setOpen] = useState(false);

  if (!payments || !tenants || !invoices) {
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
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const thisMonth = payments
    .filter((p) => p.paidAt >= monthStart)
    .reduce((s, p) => s + p.amount, 0);
  const total = payments.reduce((s, p) => s + p.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  async function submit(values: {
    tenantId: Id<"tenants">;
    invoiceId?: Id<"invoices">;
    amount: number;
    method: string;
    reference?: string;
  }) {
    await recordPayment({
      tenantId: values.tenantId,
      invoiceId: values.invoiceId,
      amount: values.amount,
      method: values.method as "mtn_momo" | "telecel_cash" | "airteltigo_money" | "bank" | "cash",
      reference: values.reference,
    });
    setOpen(false);
  }

  return (
    <>
      <DataPage
        title="Payments & receipts"
        subtitle="Every cedi received, with a receipt"
        action="Record payment"
        onAction={() => setOpen(true)}
        loading={false}
        stats={[
          { label: "Received this month", value: cediFromPesewas(thisMonth) },
          { label: "Total received", value: cediFromPesewas(total) },
          { label: "Receipts issued", value: String(payments.length) },
          { label: "Overdue invoices", value: String(overdueCount) },
        ]}
        columns={[
          {
            key: "r",
            label: "Receipt",
            render: (r) => <span className="font-mono text-xs font-semibold">{r.receiptNo}</span>,
          },
          {
            key: "t",
            label: "Tenant",
            render: (r) => (
              <span className="font-semibold">{tenantName.get(r.tenantId) ?? "—"}</span>
            ),
          },
          { key: "m", label: "Method", render: (r) => PAYMENT_METHODS[r.method] ?? r.method },
          { key: "d", label: "Date", render: (r) => formatDateTime(r.paidAt) },
          {
            key: "a",
            label: "Amount",
            className: "text-right",
            render: (r) => <Badge tone="green">+{cediFromPesewas(r.amount)}</Badge>,
          },
        ]}
        rows={payments}
      />

      <RecordPaymentDialog
        open={open}
        onOpenChange={setOpen}
        tenants={tenants}
        invoices={invoices}
        onSubmit={submit}
        busy={false}
      />
    </>
  );
}

function RecordPaymentDialog({
  open,
  onOpenChange,
  tenants,
  invoices,
  onSubmit,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenants: Doc<"tenants">[];
  invoices: InvoiceRow[];
  onSubmit: (values: {
    tenantId: Id<"tenants">;
    invoiceId?: Id<"invoices">;
    amount: number;
    method: string;
    reference?: string;
  }) => Promise<void>;
  busy: boolean;
}) {
  const [tenantId, setTenantId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mtn_momo");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const unpaid = tenantId
    ? invoices.filter((i) => i.tenantId === tenantId && i.status !== "paid" && i.status !== "draft")
    : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const pesewas = pesewasFromCedi(amount);
    if (!tenantId) {
      setError("Select a tenant.");
      return;
    }
    if (Number.isNaN(pesewas)) {
      setError("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        tenantId: tenantId as Id<"tenants">,
        invoiceId: invoiceId ? (invoiceId as Id<"invoices">) : undefined,
        amount: pesewas,
        method,
        reference: reference.trim() || undefined,
      });
      setTenantId("");
      setInvoiceId("");
      setAmount("");
      setMethod("mtn_momo");
      setReference("");
    } catch (err) {
      setError(friendlyError(err, "Could not record the payment."));
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
      title="Record payment"
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label>Tenant</Label>
          <Select
            value={tenantId}
            onValueChange={(v) => {
              setTenantId(v);
              setInvoiceId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Invoice (optional)</Label>
          <Select value={invoiceId} onValueChange={setInvoiceId} disabled={!tenantId}>
            <SelectTrigger>
              <SelectValue placeholder="No specific invoice" />
            </SelectTrigger>
            <SelectContent>
              {unpaid.map((i) => (
                <SelectItem key={i._id} value={i._id}>
                  {i.number} · {cediFromPesewas(i.amount - i.paid)} outstanding
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (GH₵)</Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="1,600"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reference">Reference (optional)</Label>
          <Input
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="MoMo transaction ID"
          />
        </div>
        {error && (
          <p className="rounded-xl bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            disabled={submitting || busy}
            className="h-12 w-full justify-center sm:h-auto sm:w-auto"
          >
            {submitting || busy ? "Saving…" : "Record payment"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
