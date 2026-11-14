import { internalMutation } from "./_generated/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";
export const flagExpiring = internalMutation({ args: {}, handler: async (ctx) => {
  const now = Date.now();
  const horizon = now + 60 * 24 * 60 * 60 * 1000;
  const rows = await ctx.db.query("leases")
    .filter(q => q.neq(q.field("status"), "ended")).collect();
  for (const lease of rows) {
    const status = lease.end <= now ? "ended" : lease.end <= horizon ? "expiring" : "active";
    if (lease.status !== status) await ctx.db.patch(lease._id, { status });
  }
}});


export const list = query({ args: {}, handler: async (ctx) => {
  const me = await requireUser(ctx);
  return ctx.db.query("leases").withIndex("by_landlord", (q) => q.eq("landlordId", me)).collect();
}});

export const create = mutation({
  args: { tenantId: v.id("tenants"), unitId: v.id("units"), start: v.number(), end: v.number(), rent: v.number(), advanceMonths: v.number(), deposit: v.optional(v.number()) },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    const [t, u] = [await ctx.db.get(a.tenantId), await ctx.db.get(a.unitId)];
    if (!t || t.landlordId !== me || !u || u.landlordId !== me) throw new Error("Tenant or unit not found");
    if (a.end <= a.start) throw new Error("End date must be after start date");
    await ctx.db.patch(a.unitId, { status: "occupied" });
    return ctx.db.insert("leases", { ...a, landlordId: me, status: "active" });
  },
});

export const end = mutation({ args: { id: v.id("leases") }, handler: async (ctx, { id }) => {
  const me = await requireUser(ctx);
  const l = await ctx.db.get(id);
  if (!l || l.landlordId !== me) throw new Error("Lease not found");
  await ctx.db.patch(id, { status: "ended", end: Date.now() });
  await ctx.db.patch(l.unitId, { status: "vacant" });
}});
