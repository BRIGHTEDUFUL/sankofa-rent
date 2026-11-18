import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, nextNumber } from "./lib";
import { query } from "./_generated/server";
export const record = mutation({
  args: {
    tenantId: v.id("tenants"),
    invoiceId: v.optional(v.id("invoices")),
    amount: v.number(),
    method: v.union(
      v.literal("mtn_momo"),
      v.literal("telecel_cash"),
      v.literal("airteltigo_money"),
      v.literal("bank"),
      v.literal("cash"),
    ),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    if (!Number.isSafeInteger(a.amount) || a.amount <= 0)
      throw new Error("Amount must be positive integer pesewas");
    const tenant = await ctx.db.get(a.tenantId);
    if (!tenant || tenant.landlordId !== me) throw new Error("Tenant not found");
    const receiptNo = await nextNumber(ctx, me, "receipt", "RCP");
    if (a.invoiceId) {
      const inv = await ctx.db.get(a.invoiceId);
      if (!inv || inv.landlordId !== me || inv.tenantId !== a.tenantId)
        throw new Error("Invoice not found");
      if (inv.status === "draft") throw new Error("Invoice has not been issued");
      if (a.amount > inv.amount - inv.paid) throw new Error("Payment exceeds invoice balance");
      const paid = inv.paid + a.amount;
      await ctx.db.patch(inv._id, {
        paid,
        status: paid === inv.amount ? "paid" : inv.dueDate < Date.now() ? "overdue" : "partial",
      });
    }
    return ctx.db.insert("payments", { ...a, landlordId: me, receiptNo, paidAt: Date.now() });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    return ctx.db
      .query("payments")
      .withIndex("by_landlord", (q) => q.eq("landlordId", me))
      .order("desc")
      .collect();
  },
});

/** Everything needed to render a tenant-facing receipt, scoped to the landlord. */
export const receipt = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, { paymentId }) => {
    const me = await requireUser(ctx);
    const payment = await ctx.db.get(paymentId);
    if (!payment || payment.landlordId !== me) throw new Error("Receipt not found");

    const tenant = await ctx.db.get(payment.tenantId);
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant", (q) => q.eq("tenantId", payment.tenantId))
      .collect();

    const outstanding = invoices.filter(
      (i) => i.status !== "paid" && i.status !== "draft" && i.amount - i.paid > 0,
    );
    const balance = outstanding.reduce((sum, i) => sum + (i.amount - i.paid), 0);
    const nextInvoice = [...outstanding].sort((a, b) => a.dueDate - b.dueDate)[0];

    const appliedInvoice = payment.invoiceId ? await ctx.db.get(payment.invoiceId) : null;
    const lease = appliedInvoice?.leaseId ? await ctx.db.get(appliedInvoice.leaseId) : null;
    const unitId = lease?.unitId ?? tenant?.unitId;
    const unit = unitId ? await ctx.db.get(unitId) : null;
    const property = unit?.propertyId ? await ctx.db.get(unit.propertyId) : null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", me))
      .unique();

    return {
      payment,
      tenantName: tenant?.name ?? "Tenant",
      tenantPhone: tenant?.phone ?? null,
      businessName: profile?.businessName?.trim() || null,
      region: profile?.region?.trim() || null,
      currency: profile?.currency ?? "GHS",
      invoiceNumber: appliedInvoice?.number ?? null,
      invoicePeriod: appliedInvoice?.period ?? null,
      propertyName: property?.name ?? null,
      unitLabel: unit?.label ?? null,
      balance,
      nextPayment: nextInvoice
        ? { number: nextInvoice.number, dueDate: nextInvoice.dueDate, amount: nextInvoice.amount - nextInvoice.paid }
        : null,
    };
  },
});
