import { query } from "./_generated/server";
import { requireUser } from "./lib";

export const summary = query({ args: {}, handler: async (ctx) => {
  const me = await requireUser(ctx);
  const d = new Date();
  const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  const payments = await ctx.db.query("payments")
    .withIndex("by_landlord", (q) => q.eq("landlordId", me).gte("paidAt", monthStart)).collect();
  const units = await ctx.db.query("units").withIndex("by_landlord", (q) => q.eq("landlordId", me)).collect();
  const overdue = await ctx.db.query("invoices")
    .withIndex("by_status", (q) => q.eq("landlordId", me).eq("status", "overdue")).collect();
  const occupied = units.filter((u) => u.status === "occupied");
  return {
    collectedThisMonth: payments.reduce((s, p) => s + p.amount, 0),
    expectedThisMonth: occupied.reduce((s, u) => s + u.rent, 0),
    occupancyPercent: units.length ? Math.round((occupied.length / units.length) * 100) : 0,
    arrears: overdue.reduce((s, i) => s + (i.amount - i.paid), 0),
    openMaintenance: (await ctx.db.query("maintenance")
      .withIndex("by_status", (q) => q.eq("landlordId", me).eq("status", "open")).collect()).length,
  };
}});
