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

export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    propertyId: v.optional(v.id("properties")),
    channels: v.array(v.union(v.literal("sms"), v.literal("email"), v.literal("whatsapp"))),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    return ctx.db.insert("announcements", { ...a, landlordId: me, pinned: false });
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
