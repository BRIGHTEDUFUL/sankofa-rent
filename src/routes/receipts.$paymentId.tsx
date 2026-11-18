import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft, Check, Copy, Printer } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { Badge, Card } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  currencyLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  formatMonth,
  isCurrencyCode,
  PAYMENT_METHODS,
} from "@/lib/format";

export const Route = createFileRoute("/receipts/$paymentId")({
  head: () => ({
    meta: [
      { title: "Payment receipt — Sankofa Rent" },
      { name: "description", content: "Official rent payment receipt." },
    ],
  }),
  component: ReceiptPage,
});

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <span className="text-xs uppercase tracking-widest text-muted-foreground sm:text-sm">
        {label}
      </span>
      <span
        className={`text-right text-sm ${strong ? "text-lg font-bold tabular-nums" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

function ReceiptPage() {
  const { paymentId } = Route.useParams();
  const receipt = useQuery(api.payments.receipt, { paymentId: paymentId as Id<"payments"> });
  const [copied, setCopied] = useState(false);

  if (!receipt) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card className="h-96 animate-pulse bg-muted/40" />
      </div>
    );
  }

  const code = isCurrencyCode(receipt.currency) ? receipt.currency : "GHS";
  const money = (minor: number) => formatMoney(minor, code);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Actions — hidden when printing */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/payments"
            className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted pressable"
          >
            <ArrowLeft className="h-4 w-4" />
            Payments
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" className="h-11" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Link copied" : "Copy link"}
            </Button>
            <Button className="h-11" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print / PDF
            </Button>
          </div>
        </div>

        <Card className="!p-6 sm:!p-10">
          <div className="flex items-start justify-between gap-4 border-b-2 border-primary pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {receipt.businessName ?? "Sankofa Rent"}
              </p>
              {receipt.region ? (
                <p className="mt-1 text-xs text-muted-foreground">{receipt.region}</p>
              ) : null}
            </div>
            <Badge tone="green">Paid</Badge>
          </div>

          <div className="py-7 text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Payment receipt</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Receipt no.{" "}
              <span className="font-mono font-semibold">{receipt.payment.receiptNo}</span>
            </p>
          </div>

          <div className="rounded-2xl bg-primary-soft px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Amount paid</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
              {money(receipt.payment.amount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {currencyLabel(code)} ·{" "}
              {PAYMENT_METHODS[receipt.payment.method] ?? receipt.payment.method}
            </p>
          </div>

          <div className="mt-6">
            <Row label="Tenant" value={receipt.tenantName} />
            {receipt.tenantPhone ? <Row label="Phone" value={receipt.tenantPhone} /> : null}
            <Row label="Date paid" value={formatDateTime(receipt.payment.paidAt)} />
            <Row
              label="Property / unit"
              value={[receipt.propertyName, receipt.unitLabel].filter(Boolean).join(" · ") || "—"}
            />
            {receipt.invoiceNumber ? (
              <Row
                label="Invoice"
                value={`${receipt.invoiceNumber}${receipt.invoicePeriod ? ` · ${formatMonth(receipt.invoicePeriod)}` : ""}`}
              />
            ) : null}
            {receipt.payment.reference ? (
              <Row label="Reference" value={receipt.payment.reference} />
            ) : null}
            <Row label="Balance after payment" value={money(receipt.balance)} />
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-muted/30 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Next payment
            </p>
            {receipt.nextPayment ? (
              <>
                <p className="mt-2 text-lg font-bold tabular-nums">
                  {money(receipt.nextPayment.amount)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Due {formatDate(receipt.nextPayment.dueDate)} · invoice{" "}
                  {receipt.nextPayment.number}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No upcoming invoice. You are up to date.
              </p>
            )}
          </div>

          <p className="mt-8 border-t border-border/60 pt-5 text-center text-xs text-muted-foreground">
            Thank you for your payment. Keep this receipt for your records.
            <br />
            Generated {formatDate(Date.now())} by {receipt.businessName ?? "Sankofa Rent"}.
          </p>
        </Card>
      </div>
    </div>
  );
}
