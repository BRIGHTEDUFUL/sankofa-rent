import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";

export const me = query({ args: {}, handler: async (ctx) => {
  const me = await requireUser(ctx);
  return ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", me)).unique();
}});

export const update = mutation({
  args: {
    firstName: v.optional(v.string()), lastName: v.optional(v.string()),
    phone: v.optional(v.string()), businessName: v.optional(v.string()),
    region: v.optional(v.string()), momoNumber: v.optional(v.string()),
    rentDueDay: v.optional(v.number()),
    notifySms: v.optional(v.boolean()), notifyEmail: v.optional(v.boolean()), notifyWhatsapp: v.optional(v.boolean()),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    const p = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", me)).unique();
    if (!p) throw new Error("Profile not found");
    await ctx.db.patch(p._id, a);
  },
});
