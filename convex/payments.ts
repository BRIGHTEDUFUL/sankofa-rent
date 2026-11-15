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
