import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";

export const me = query({ args: {}, handler: async (ctx) => {
  const me = await requireUser(ctx);
  return ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", me)).unique();
}});

// Only the fields below are writable. `plan` and `currency` are never client-controlled.
export const update = mutation({
  args: {
    firstName: v.optional(v.string()), lastName: v.optional(v.string()),
    phone: v.optional(v.string()), businessName: v.optional(v.string()),
    region: v.optional(v.string()), momoNumber: v.optional(v.string()),
    momoNetwork: v.optional(v.union(v.literal("MTN"), v.literal("Telecel"), v.literal("AirtelTigo"))),
    bankName: v.optional(v.string()), bankAccount: v.optional(v.string()),
    rentDueDay: v.optional(v.number()), lateFeePercent: v.optional(v.number()),
    notifySms: v.optional(v.boolean()), notifyEmail: v.optional(v.boolean()), notifyWhatsapp: v.optional(v.boolean()),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    if (a.rentDueDay !== undefined && (!Number.isInteger(a.rentDueDay) || a.rentDueDay < 1 || a.rentDueDay > 31)) {
      throw new Error("Rent due day must be between 1 and 31");
    }
    if (a.lateFeePercent !== undefined && (!Number.isFinite(a.lateFeePercent) || a.lateFeePercent < 0)) {
      throw new Error("Late fee percent must be zero or greater");
    }
    const p = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", me)).unique();
    if (!p) throw new Error("Profile not found");
    await ctx.db.patch(p._id, a);
  },
});
