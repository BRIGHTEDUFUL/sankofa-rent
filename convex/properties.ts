import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";

export const list = query({ args: {}, handler: async (ctx) => {
  const me = await requireUser(ctx);
  const props = await ctx.db.query("properties").withIndex("by_landlord", (q) => q.eq("landlordId", me)).collect();
  return Promise.all(props.map(async (p) => {
    const units = await ctx.db.query("units").withIndex("by_property", (q) => q.eq("propertyId", p._id)).collect();
    return { ...p, units, occupied: units.filter((u) => u.status === "occupied").length };
  }));
}});

export const create = mutation({
  args: { name: v.string(), area: v.string(), region: v.optional(v.string()), ghanaPostGps: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    return ctx.db.insert("properties", { ...a, landlordId: me });
  },
});

export const remove = mutation({ args: { id: v.id("properties") }, handler: async (ctx, { id }) => {
  const me = await requireUser(ctx);
  const p = await ctx.db.get(id);
  if (!p || p.landlordId !== me) throw new Error("Property not found");
  const units = await ctx.db.query("units").withIndex("by_property", (q) => q.eq("propertyId", id)).collect();
  if (units.some((u) => u.status === "occupied")) throw new Error("Property has occupied units");
  for (const u of units) await ctx.db.delete(u._id);
  await ctx.db.delete(id);
}});

export const addUnit = mutation({
  args: { propertyId: v.id("properties"), label: v.string(), bedrooms: v.optional(v.number()), rent: v.number() },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    const p = await ctx.db.get(a.propertyId);
    if (!p || p.landlordId !== me) throw new Error("Property not found");
    return ctx.db.insert("units", { ...a, landlordId: me, status: "vacant" });
  },
});
