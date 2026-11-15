import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";

// Balance is the sum of outstanding (non-draft, non-paid) invoice amounts.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    const tenants = await ctx.db
      .query("tenants")
      .withIndex("by_landlord", (q) => q.eq("landlordId", me))
      .filter((q) => q.eq(q.field("archived"), false))
      .collect();
    return Promise.all(
      tenants.map(async (t) => {
        const invoices = await ctx.db
          .query("invoices")
          .withIndex("by_tenant", (q) => q.eq("tenantId", t._id))
          .collect();
        const balance = invoices
          .filter((i) => i.status !== "paid" && i.status !== "draft")
          .reduce((s, i) => s + (i.amount - i.paid), 0);
        return { ...t, balance };
      }),
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    unitId: v.optional(v.id("units")),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    if (!a.name.trim()) throw new Error("Name is required");
    if (!a.phone.trim()) throw new Error("Phone is required");
    if (a.unitId) {
      const u = await ctx.db.get(a.unitId);
      if (!u || u.landlordId !== me) throw new Error("Unit not found");
      if (u.status !== "vacant") throw new Error("Unit is not available");
      await ctx.db.patch(a.unitId, { status: "occupied" });
    }
    return ctx.db.insert("tenants", {
      ...a,
      name: a.name.trim(),
      phone: a.phone.trim(),
      landlordId: me,
      since: Date.now(),
      archived: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tenants"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    ghanaCardNo: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const me = await requireUser(ctx);
    const t = await ctx.db.get(a.id);
    if (!t || t.landlordId !== me) throw new Error("Tenant not found");
    if (!a.name.trim()) throw new Error("Name is required");
    if (!a.phone.trim()) throw new Error("Phone is required");
    await ctx.db.patch(a.id, {
      name: a.name.trim(),
      phone: a.phone.trim(),
      email: a.email,
      emergencyContact: a.emergencyContact,
      ghanaCardNo: a.ghanaCardNo,
    });
  },
});

export const archive = mutation({
  args: { id: v.id("tenants") },
  handler: async (ctx, { id }) => {
    const me = await requireUser(ctx);
    const t = await ctx.db.get(id);
    if (!t || t.landlordId !== me) throw new Error("Tenant not found");
    await ctx.db.patch(id, { archived: true });
  },
});
