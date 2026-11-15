import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    const props = await ctx.db
      .query("properties")
      .withIndex("by_landlord", (q) => q.eq("landlordId", me))
      .collect();
    return Promise.all(
      props.map(async (p) => {
        const units = await ctx.db
          .query("units")
          .withIndex("by_property", (q) => q.eq("propertyId", p._id))
          .collect();
        return { ...p, units, occupied: units.filter((u) => u.status === "occupied").length };
      }),
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    area: v.string(),
    region: v.optional(v.string()),
    ghanaPostGps: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    if (!a.name.trim()) throw new Error("Name is required");
    return ctx.db.insert("properties", { ...a, name: a.name.trim(), landlordId: me });
  },
});

export const update = mutation({
  args: {
    id: v.id("properties"),
    name: v.string(),
    area: v.string(),
    region: v.optional(v.string()),
    ghanaPostGps: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    const p = await ctx.db.get(a.id);
    if (!p || p.landlordId !== me) throw new Error("Property not found");
    if (!a.name.trim()) throw new Error("Name is required");
    await ctx.db.patch(a.id, {
      name: a.name.trim(),
      area: a.area,
      region: a.region,
      ghanaPostGps: a.ghanaPostGps,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("properties") },
  handler: async (ctx, { id }) => {
    const me = await requireUser(ctx);
    const p = await ctx.db.get(id);
    if (!p || p.landlordId !== me) throw new Error("Property not found");
    const units = await ctx.db
      .query("units")
      .withIndex("by_property", (q) => q.eq("propertyId", id))
      .collect();
    if (units.some((u) => u.status === "occupied")) throw new Error("Property has occupied units");
    for (const u of units) await ctx.db.delete(u._id);
    await ctx.db.delete(id);
  },
});

export const addUnit = mutation({
  args: {
    propertyId: v.id("properties"),
    label: v.string(),
    bedrooms: v.optional(v.number()),
    rent: v.number(),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    const p = await ctx.db.get(a.propertyId);
    if (!p || p.landlordId !== me) throw new Error("Property not found");
    if (!a.label.trim()) throw new Error("Unit label is required");
    if (!Number.isSafeInteger(a.rent) || a.rent <= 0)
      throw new Error("Rent must be positive integer pesewas");
    return ctx.db.insert("units", {
      ...a,
      label: a.label.trim(),
      landlordId: me,
      status: "vacant",
    });
  },
});

export const updateUnit = mutation({
  args: {
    id: v.id("units"),
    label: v.string(),
    bedrooms: v.optional(v.number()),
    rent: v.number(),
    status: v.union(v.literal("vacant"), v.literal("occupied"), v.literal("maintenance")),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    const u = await ctx.db.get(a.id);
    if (!u || u.landlordId !== me) throw new Error("Unit not found");
    if (!a.label.trim()) throw new Error("Unit label is required");
    if (!Number.isSafeInteger(a.rent) || a.rent <= 0)
      throw new Error("Rent must be positive integer pesewas");
    await ctx.db.patch(a.id, {
      label: a.label.trim(),
      bedrooms: a.bedrooms,
      rent: a.rent,
      status: a.status,
    });
  },
});
