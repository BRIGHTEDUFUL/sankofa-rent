import { query } from "./_generated/server";
import { requireUser } from "./lib";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    const d = new Date();
    const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_landlord", (q) => q.eq("landlordId", me).gte("paidAt", monthStart))
      .collect();
    const units = await ctx.db
      .query("units")
      .withIndex("by_landlord", (q) => q.eq("landlordId", me))
      .collect();
    const overdue = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("landlordId", me).eq("status", "overdue"))
      .collect();
    const occupied = units.filter((u) => u.status === "occupied");
    return {
      collectedThisMonth: payments.reduce((s, p) => s + p.amount, 0),
      expectedThisMonth: occupied.reduce((s, u) => s + u.rent, 0),
      occupancyPercent: units.length ? Math.round((occupied.length / units.length) * 100) : 0,
      arrears: overdue.reduce((s, i) => s + (i.amount - i.paid), 0),
      openMaintenance: (
        await ctx.db
          .query("maintenance")
          .withIndex("by_status", (q) => q.eq("landlordId", me).eq("status", "open"))
          .collect()
      ).length,
    };
  },
});

// Last six calendar months of rent due (invoiced) against rent collected (paid).
export const monthly = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    const now = new Date();
    const order: string[] = [];
    const buckets = new Map<string, { label: string; collected: number; due: number }>();
    // Use UTC date to ensure consistent month calculation across timezones
    const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      order.push(key);
      buckets.set(key, { label: MONTH_NAMES[d.getUTCMonth()] ?? "", collected: 0, due: 0 });
    }
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_landlord", (q) => q.eq("landlordId", me))
      .collect();
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_landlord", (q) => q.eq("landlordId", me))
      .collect();
    for (const p of payments) {
      const d = new Date(p.paidAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const b = buckets.get(key);
      if (b) b.collected += p.amount;
    }
    for (const inv of invoices) {
      const d = new Date(inv.dueDate);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const b = buckets.get(key);
      if (b) b.due += inv.amount;
    }
    return order.map((key) => {
      const b = buckets.get(key);
      return { key, label: b?.label ?? key, collected: b?.collected ?? 0, due: b?.due ?? 0 };
    });
  },
});
