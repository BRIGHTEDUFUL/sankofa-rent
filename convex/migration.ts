import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// One-time fixes for deployments whose profiles predate the `role` field.
// Run with:  npx convex run migration:backfillAdmin
// Safe to re-run: it never demotes an existing admin.

// If nobody is an admin yet, promote the earliest-created profile so an
// existing account can edit branding. No-op when an admin already exists.
export const backfillAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    if (profiles.some((p) => p.role === "admin")) {
      return { promoted: false, reason: "An admin already exists" };
    }
    if (profiles.length === 0) {
      return { promoted: false, reason: "No profiles yet — the first sign-up becomes admin" };
    }
    const earliest = profiles.reduce((a, b) =>
      a._creationTime <= b._creationTime ? a : b,
    );
    await ctx.db.patch(earliest._id, { role: "admin" });
    return { promoted: true, userId: earliest.userId };
  },
});

// One-time product rename: upgrade branding rows that still hold the old
// default name to the new default. Customised brands (anything not exactly
// "Nyumba Rent") are deliberately left alone.
//   npx convex run migration:renameDefaultBrand
export const renameDefaultBrand = internalMutation({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("branding").first();
    if (!row) return { renamed: false, reason: "no branding row yet" };
    if (row.appName !== "Nyumba Rent") {
      return { renamed: false, reason: "brand is customised — left alone" };
    }
    await ctx.db.patch(row._id, { appName: "Sankofa Rent", updatedAt: Date.now() });
    return { renamed: true };
  },
});

// Operator cleanup: delete a DRAFT invoice by its number (never touches
// sent/partial/paid records). Used to remove accidental duplicates created
// while testing:  npx convex run migration:deleteDraftInvoiceByNumber '{"number":"INV-1002"}'
export const deleteDraftInvoiceByNumber = internalMutation({
  args: { number: v.string() },
  handler: async (ctx, { number }) => {
    const inv = await ctx.db
      .query("invoices")
      .filter((q) => q.eq(q.field("number"), number.trim()))
      .first();
    if (!inv) return { deleted: false, reason: "not found" };
    if (inv.status !== "draft") return { deleted: false, reason: "only draft invoices can be deleted" };
    await ctx.db.delete(inv._id);
    return { deleted: true, number };
  },
});

// Escape hatch if backfillAdmin promoted the wrong account:
//   npx convex run migration:setAdmin '{"email":"you@example.com"}'
// Demotes every other admin so exactly one account holds the role.
export const setAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const target = email.trim().toLowerCase();
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.email?.toLowerCase() === target);
    if (!user) throw new Error(`No user with email ${target}`);
    const profiles = await ctx.db.query("profiles").collect();
    const targetProfile = profiles.find((p) => p.userId === user._id);
    if (!targetProfile) throw new Error("That user has no profile yet");
    for (const p of profiles) {
      if (p._id === targetProfile._id) {
        if (p.role !== "admin") await ctx.db.patch(p._id, { role: "admin" });
      } else if (p.role === "admin") {
        await ctx.db.patch(p._id, { role: "user" });
      }
    }
    return { admin: target };
  },
});

// Migrate all app data from one account to another — used to hand a seeded
// dataset over to a new owner. Re-points every landlord-scoped table and
// copies the business-facing profile fields (name, business identity, MoMo
// and bank details, notification preferences, rent-due settings) so receipts
// and invoices keep their look. The target account must already exist and
// have a profile (sign up in the app first). Roles are NOT changed — use
// setAdmin afterwards to promote exactly one admin.
//   npx convex run migration:adoptLandlordData '{"fromEmail":"old@example.com","toEmail":"new@example.com"}'
export const adoptLandlordData = internalMutation({
  args: { fromEmail: v.string(), toEmail: v.string() },
  handler: async (ctx, { fromEmail, toEmail }) => {
    const norm = (e: string) => e.trim().toLowerCase();
    const users = await ctx.db.query("users").collect();
    const fromUser = users.find((u) => u.email?.toLowerCase() === norm(fromEmail));
    const toUser = users.find((u) => u.email?.toLowerCase() === norm(toEmail));
    if (!fromUser) throw new Error(`No user with email ${fromEmail}`);
    if (!toUser) throw new Error(`No user with email ${toEmail}`);

    const profiles = await ctx.db.query("profiles").collect();
    const fromProfile = profiles.find((p) => p.userId === fromUser._id);
    const toProfile = profiles.find((p) => p.userId === toUser._id);
    if (!fromProfile) throw new Error("Source profile not found");
    if (!toProfile) throw new Error("Target profile not found");

    const moved: Record<string, number> = {};
    const tables = [
      "properties",
      "units",
      "tenants",
      "leases",
      "invoices",
      "payments",
      "maintenance",
      "announcements",
    ] as const;
    for (const table of tables) {
      const rows = await ctx.db
        .query(table)
        .withIndex("by_landlord", (q) => q.eq("landlordId", fromUser._id))
        .collect();
      for (const row of rows) {
        await ctx.db.patch(row._id, { landlordId: toUser._id });
      }
      moved[table] = rows.length;
    }
    const counters = await ctx.db
      .query("counters")
      .filter((q) => q.eq(q.field("landlordId"), fromUser._id))
      .collect();
    for (const row of counters) {
      await ctx.db.patch(row._id, { landlordId: toUser._id });
    }
    moved.counters = counters.length;

    await ctx.db.patch(toProfile._id, {
      // Personal names stay with each account — only business identity copies.
      phone: fromProfile.phone,
      businessName: fromProfile.businessName,
      region: fromProfile.region,
      momoNumber: fromProfile.momoNumber,
      momoNetwork: fromProfile.momoNetwork,
      bankName: fromProfile.bankName,
      bankAccount: fromProfile.bankAccount,
      rentDueDay: fromProfile.rentDueDay,
      lateFeePercent: fromProfile.lateFeePercent,
      notifySms: fromProfile.notifySms,
      notifyEmail: fromProfile.notifyEmail,
      notifyWhatsapp: fromProfile.notifyWhatsapp,
    });

    return { moved };
  },
});
