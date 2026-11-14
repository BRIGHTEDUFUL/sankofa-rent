import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";

export const list = query({ args: {}, handler: async (ctx) => {
  const me = await requireUser(ctx);
  return ctx.db.query("maintenance").withIndex("by_landlord", (q) => q.eq("landlordId", me)).order("desc").collect();
}});

export const create = mutation({
  args: {
    propertyId: v.id("properties"), unitId: v.optional(v.id("units")), title: v.string(),
    description: v.optional(v.string()), reportedBy: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    const p = await ctx.db.get(a.propertyId);
    if (!p || p.landlordId !== me) throw new Error("Property not found");
    return ctx.db.insert("maintenance", { ...a, landlordId: me, status: "open" });
  },
});

export const updateStatus = mutation({
  args: { id: v.id("maintenance"), status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved")), cost: v.optional(v.number()) },
  handler: async (ctx, { id, ...rest }) => {
    const me = await requireUser(ctx);
    const m = await ctx.db.get(id);
    if (!m || m.landlordId !== me) throw new Error("Request not found");
    await ctx.db.patch(id, rest);
  },
});
