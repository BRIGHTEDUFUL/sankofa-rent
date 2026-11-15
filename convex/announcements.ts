import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    return ctx.db
      .query("announcements")
      .withIndex("by_landlord", (q) => q.eq("landlordId", me))
      .order("desc")
      .collect();
  },
});

// Public read-only query for the tenant notice board.
// Delivers in-app notices to tenants without requiring an external SMS/WhatsApp service.
export const publicList = query({
  args: {
    propertyId: v.optional(v.id("properties")),
  },
  handler: async (ctx, args) => {
    let announcements = await ctx.db.query("announcements").order("desc").collect();

    if (args.propertyId) {
      announcements = announcements.filter(
        (a) => !a.propertyId || a.propertyId === args.propertyId,
      );
    }

    // Pinned notices first, then newest
    announcements.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b._creationTime - a._creationTime;
    });

    const properties = await ctx.db.query("properties").collect();
    const propMap = new Map(properties.map((p) => [p._id, p.name]));

    return announcements.map((a) => ({
      _id: a._id,
      _creationTime: a._creationTime,
      title: a.title,
      body: a.body,
      propertyId: a.propertyId,
      propertyName: a.propertyId ? (propMap.get(a.propertyId) ?? "Property") : "All properties",
      pinned: a.pinned,
    }));
  },
});

// Public properties list for the tenant notice board filter
export const publicProperties = query({
  args: {},
  handler: async (ctx) => {
    const properties = await ctx.db.query("properties").collect();
    return properties.map((p) => ({
      _id: p._id,
      name: p.name,
      area: p.area,
    }));
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    propertyId: v.optional(v.id("properties")),
    pinned: v.optional(v.boolean()),
    channels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    return ctx.db.insert("announcements", {
      title: a.title,
      body: a.body,
      propertyId: a.propertyId,
      channels: a.channels ?? ["in_app"],
      landlordId: me,
      pinned: a.pinned ?? false,
    });
  },
});

export const togglePin = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, { id }) => {
    const me = await requireUser(ctx);
    const a = await ctx.db.get(id);
    if (!a || a.landlordId !== me) throw new Error("Announcement not found");
    await ctx.db.patch(id, { pinned: !a.pinned });
  },
});

export const remove = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, { id }) => {
    const me = await requireUser(ctx);
    const a = await ctx.db.get(id);
    if (!a || a.landlordId !== me) throw new Error("Announcement not found");
    await ctx.db.delete(id);
  },
});
