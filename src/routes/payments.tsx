import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { formatDateTime, PAYMENT_METHODS, pesewasFromCedi, friendlyError } from "@/lib/format";
import { useMoney } from "@/lib/currency";

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

function Page() {
  const payments = useQuery(api.payments.list, {});
  const tenants = useQuery(api.tenants.list, {});
  const invoices = useQuery(api.invoices.list, {});
  const recordPayment = useMutation(api.payments.record);
  const { money, symbol } = useMoney();

  const [open, setOpen] = useState(false);
  const [defaultMethod, setDefaultMethod] = useState("mtn_momo");
  const [receiptId, setReceiptId] = useState<Id<"payments"> | null>(null);

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
    const paymentId = await recordPayment({
      tenantId: values.tenantId,
      invoiceId: values.invoiceId,
      amount: values.amount,
      method: values.method as "mtn_momo" | "telecel_cash" | "airteltigo_money" | "bank" | "cash",
      reference: values.reference,
    });
    setReceiptId(paymentId);
    setOpen(false);
  }

  return (
    <>
      {receiptId && (
        <div
          role="status"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary-soft px-4 py-3"
        >
          <span className="text-sm font-medium text-primary">
            Payment recorded — the receipt is ready to print or share with the tenant.
          </span>
          <div className="flex gap-2">
            <Link
              to="/receipts/$paymentId"
              params={{ paymentId: receiptId }}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground pressable"
            >
              View receipt
            </Link>
            <button
              onClick={() => setReceiptId(null)}
              className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted pressable"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <DataPage
        title="Payments & receipts"
        subtitle="Every payment received, with a receipt"
        action="Record payment"
        onAction={() => {
          setDefaultMethod("mtn_momo");
          setOpen(true);
        }}
        secondaryAction={{
          label: "Record cash payment",
          onClick: () => {
            setDefaultMethod("cash");
            setOpen(true);
          },
        }}
        loading={false}
        stats={[
          { label: "Received this month", value: money(thisMonth) },
          { label: "Total received", value: money(total) },
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
            render: (r) => <Badge tone="green">+{money(r.amount)}</Badge>,
          },
          {
            key: "rc",
            label: "Receipt",
            className: "text-right",
            render: (r) => (
              <Link
                to="/receipts/$paymentId"
                params={{ paymentId: r._id }}
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-primary hover:bg-muted sm:min-h-0 sm:rounded-full sm:px-2.5 sm:py-1 pressable"
              >
                View
              </Link>
            ),
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
        defaultMethod={defaultMethod}
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
  defaultMethod,
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
  defaultMethod: string;
}) {
  const { money, symbol } = useMoney();

  const [tenantId, setTenantId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mtn_momo");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setMethod(defaultMethod);
  }, [open, defaultMethod]);

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
      setMethod(defaultMethod);
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
          <Label htmlFor="payment-tenant">Tenant</Label>
          <Select
            value={tenantId}
            onValueChange={(v) => {
              setTenantId(v);
              setInvoiceId("");
            }}
          >
            <SelectTrigger id="payment-tenant">
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
          <Label htmlFor="payment-invoice">Invoice (optional)</Label>
          <Select value={invoiceId} onValueChange={setInvoiceId} disabled={!tenantId}>
            <SelectTrigger id="payment-invoice">
              <SelectValue placeholder="No specific invoice" />
            </SelectTrigger>
            <SelectContent>
              {unpaid.map((i) => (
                <SelectItem key={i._id} value={i._id}>
                  {i.number} · {money(i.amount - i.paid)} outstanding
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount ({symbol})</Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="1,600"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payment-method">Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="payment-method">
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
            placeholder={method === "cash" ? "Optional note (e.g. received by)" : "Transaction ID"}
          />
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
        <div className="pt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
