import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";

export const list = query({ args: {}, handler: async (ctx) => {
  const me = await requireUser(ctx);
  return ctx.db.query("tenants").withIndex("by_landlord", q => q.eq("landlordId", me))
    .filter(q => q.eq(q.field("archived"), false)).collect();
}});

export const create = mutation({
  args: { name: v.string(), phone: v.string(), email: v.optional(v.string()), unitId: v.optional(v.id("units")) },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    if (a.unitId) {
      const u = await ctx.db.get(a.unitId);
      if (!u || u.landlordId !== me) throw new Error("Unit not found");
      if (u.status !== "vacant") throw new Error("Unit is not available");
      await ctx.db.patch(a.unitId, { status: "occupied" });
    }
    return ctx.db.insert("tenants", { ...a, landlordId: me, since: Date.now(), archived: false });
  },
});
