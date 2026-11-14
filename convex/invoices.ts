import { internalMutation } from "./_generated/server";
import { nextNumber } from "./lib";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";
export const markOverdue = internalMutation({ args: {}, handler: async (ctx) => {
  const now = Date.now();
  for (const status of ["sent", "partial"] as const) {
    const rows = await ctx.db.query("invoices").filter(q => q.and(
      q.eq(q.field("status"), status), q.lt(q.field("dueDate"), now))).collect();
    for (const inv of rows) await ctx.db.patch(inv._id, { status: "overdue" });
  }
}});

export const generateMonthly = internalMutation({ args: {}, handler: async (ctx) => {
  const d = new Date(); const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  const nextMonth = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  const leases = await ctx.db.query("leases").filter(q => q.and(
    q.neq(q.field("status"), "ended"), q.lt(q.field("start"), nextMonth),
    q.gt(q.field("end"), monthStart))).collect();
  for (const l of leases) {
    const exists = await ctx.db.query("invoices").withIndex("by_tenant", q => q.eq("tenantId", l.tenantId))
      .filter(q => q.and(q.eq(q.field("leaseId"), l._id), q.eq(q.field("period"), period))).first();
    if (exists) continue;                        // safe to re-run
    const profile = await ctx.db.query("profiles").withIndex("by_user", q => q.eq("userId", l.landlordId)).unique();
    const day = profile?.rentDueDay ?? 5;
    if (!Number.isInteger(day) || day < 1 || day > 31) throw new Error("Invalid rent due day");
    const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    // Due through the end of the selected Ghana/UTC calendar day.
    const due = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), Math.min(day, daysInMonth) + 1) - 1;
    const number = await nextNumber(ctx, l.landlordId, "invoice", "INV");
    await ctx.db.insert("invoices", { landlordId: l.landlordId, leaseId: l._id, tenantId: l.tenantId,
      number, period, dueDate: due, amount: l.rent, paid: 0, status: "draft" });
  }
}});


export const list = query({ args: {}, handler: async (ctx) => {
  const me = await requireUser(ctx);
  return ctx.db.query("invoices").withIndex("by_landlord", (q) => q.eq("landlordId", me)).order("desc").collect();
}});

// Issue a draft invoice (SMS/email delivery can be added later as an action).
export const send = mutation({ args: { id: v.id("invoices") }, handler: async (ctx, { id }) => {
  const me = await requireUser(ctx);
  const inv = await ctx.db.get(id);
  if (!inv || inv.landlordId !== me) throw new Error("Invoice not found");
  if (inv.status === "draft") await ctx.db.patch(id, { status: "sent" });
}});
