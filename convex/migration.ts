import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Scrypt } from "lucia";

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
    const earliest = profiles.reduce((a, b) => (a._creationTime <= b._creationTime ? a : b));
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
    if (inv.status !== "draft")
      return { deleted: false, reason: "only draft invoices can be deleted" };
    await ctx.db.delete(inv._id);
    return { deleted: true, number };
  },
});

// Promote or set an admin. Supports multi-admin (demoteOthers defaults to false).
//   npx convex run migration:setAdmin '{"email":"you@example.com"}'
export const setAdmin = internalMutation({
  args: { email: v.string(), demoteOthers: v.optional(v.boolean()) },
  handler: async (ctx, { email, demoteOthers = false }) => {
    const target = email.trim().toLowerCase();
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.email?.toLowerCase() === target);
    if (!user) throw new Error(`No user with email ${target}`);
    const profiles = await ctx.db.query("profiles").collect();
    const targetProfile = profiles.find((p) => p.userId === user._id);
    if (!targetProfile) throw new Error("That user has no profile yet");

    if (targetProfile.role !== "admin") {
      await ctx.db.patch(targetProfile._id, { role: "admin" });
    }

    if (demoteOthers) {
      for (const p of profiles) {
        if (p._id !== targetProfile._id && p.role === "admin") {
          await ctx.db.patch(p._id, { role: "user" });
        }
      }
    }
    return { admin: target, demoteOthers };
  },
});

// Revoke admin status from an account while ensuring at least one admin remains:
//   npx convex run migration:removeAdmin '{"email":"you@example.com"}'
export const removeAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const target = email.trim().toLowerCase();
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.email?.toLowerCase() === target);
    if (!user) throw new Error(`No user with email ${target}`);
    const profiles = await ctx.db.query("profiles").collect();
    const targetProfile = profiles.find((p) => p.userId === user._id);
    if (!targetProfile) throw new Error("That user has no profile yet");

    const admins = profiles.filter((p) => p.role === "admin");
    if (admins.length <= 1 && targetProfile.role === "admin") {
      throw new Error(
        "Cannot demote the last remaining admin. The system requires at least one admin.",
      );
    }
    await ctx.db.patch(targetProfile._id, { role: "user" });
    return { demoted: target };
  },
});

// Helper to create or sync an admin account directly (with password hash)
// e.g. for syncing accounts across dev and production.
export const syncAdminUser = internalMutation({
  args: {
    email: v.string(),
    secret: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, { email, secret, firstName, lastName }) => {
    const norm = email.trim().toLowerCase();
    const users = await ctx.db.query("users").collect();
    let user = users.find((u) => u.email?.toLowerCase() === norm);
    let userId = user?._id;

    if (!user) {
      userId = await ctx.db.insert("users", { email: norm });
      await ctx.db.insert("authAccounts", {
        userId,
        provider: "password",
        providerAccountId: norm,
        secret,
      });
      await ctx.db.insert("profiles", {
        userId,
        role: "admin",
        firstName,
        lastName,
        currency: "GHS",
        rentDueDay: 5,
        notifySms: true,
        notifyEmail: true,
        notifyWhatsapp: false,
        plan: "free",
        phone: "024 555 0101",
        region: "Greater Accra",
        businessName: "Sankofa Properties",
        momoNetwork: "MTN",
        momoNumber: "024 555 0101",
      });
    } else {
      const authAccounts = await ctx.db.query("authAccounts").collect();
      const authAcc = authAccounts.find((a) => a.userId === userId);
      if (authAcc) {
        await ctx.db.patch(authAcc._id, { secret });
      } else {
        await ctx.db.insert("authAccounts", {
          userId,
          provider: "password",
          providerAccountId: norm,
          secret,
        });
      }
      const profiles = await ctx.db.query("profiles").collect();
      const profile = profiles.find((p) => p.userId === userId);
      if (profile) {
        await ctx.db.patch(profile._id, { role: "admin" });
      }
    }

    // Demote any other admins
    const allProfiles = await ctx.db.query("profiles").collect();
    for (const p of allProfiles) {
      if (p.userId !== userId && p.role === "admin") {
        await ctx.db.patch(p._id, { role: "user" });
      }
    }

    return { synced: true, email: norm, userId };
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
    moved["counters"] = counters.length;

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

// Operator mutation: clean up all secondary/demo accounts and retain exactly:
// 1. Primary admin: edimamfaidol@gmail.com
// 2. Primary tenant: kwame.asante@example.com (or specified email)
//   npx convex run migration:cleanAccountsAndCreateTenant
export const cleanAccountsAndCreateTenant = internalMutation({
  args: {
    adminEmail: v.optional(v.string()),
    tenantEmail: v.optional(v.string()),
    tenantPasswordSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminEmail = (args.adminEmail ?? "edimamfaidol@gmail.com").trim().toLowerCase();
    const tenantEmail = (args.tenantEmail ?? "kwame.asante@example.com").trim().toLowerCase();
    const secret =
      args.tenantPasswordSecret ??
      "c9e332650ca9bdf8f128184fb59ef5c8:a2c5988cc773a5d54a9ef9b6608dacca61c7fe834bfb66230f494461f0cede63f95d459be74bb5049147f0fc6f363d8389b6e9b9d2b469ab381a59bffbfdfaa0";

    const users = await ctx.db.query("users").collect();
    const adminUser = users.find((u) => u.email?.toLowerCase() === adminEmail);
    if (!adminUser) throw new Error(`Admin user ${adminEmail} not found`);

    // Ensure admin user profile has role: admin
    const adminProfile = (await ctx.db.query("profiles").collect()).find(
      (p) => p.userId === adminUser._id,
    );
    if (adminProfile && adminProfile.role !== "admin") {
      await ctx.db.patch(adminProfile._id, { role: "admin" });
    }

    // Ensure tenant user exists
    let tenantUser = users.find((u) => u.email?.toLowerCase() === tenantEmail);
    let tenantUserId = tenantUser?._id;

    if (!tenantUser) {
      tenantUserId = await ctx.db.insert("users", { email: tenantEmail });
      await ctx.db.insert("authAccounts", {
        userId: tenantUserId,
        provider: "password",
        providerAccountId: tenantEmail,
        secret,
      });
      await ctx.db.insert("profiles", {
        userId: tenantUserId,
        role: "user",
        firstName: "Kwame",
        lastName: "Asante",
        phone: "024 777 0199",
        region: "Greater Accra",
        currency: "GHS",
        rentDueDay: 5,
        notifySms: true,
        notifyEmail: true,
        notifyWhatsapp: true,
        plan: "free",
      });
    } else {
      const authAccounts = await ctx.db.query("authAccounts").collect();
      const pwAcc = authAccounts.find((a) => a.userId === tenantUserId);
      if (pwAcc) {
        await ctx.db.patch(pwAcc._id, { secret });
      } else {
        await ctx.db.insert("authAccounts", {
          userId: tenantUserId,
          provider: "password",
          providerAccountId: tenantEmail,
          secret,
        });
      }
      const tenantProfile = (await ctx.db.query("profiles").collect()).find(
        (p) => p.userId === tenantUserId,
      );
      if (tenantProfile) {
        await ctx.db.patch(tenantProfile._id, {
          role: "user",
          firstName: "Kwame",
          lastName: "Asante",
          phone: "024 777 0199",
        });
      }
    }

    // Delete all other users and their profiles, authAccounts, authSessions
    const keepUserIds = new Set([String(adminUser._id), String(tenantUserId)]);
    const allUsers = await ctx.db.query("users").collect();
    const deleted: string[] = [];

    for (const u of allUsers) {
      if (!keepUserIds.has(String(u._id))) {
        deleted.push(u.email ?? String(u._id));

        const profs = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("userId"), u._id))
          .collect();
        for (const p of profs) await ctx.db.delete(p._id);

        const accs = await ctx.db
          .query("authAccounts")
          .filter((q) => q.eq(q.field("userId"), u._id))
          .collect();
        for (const a of accs) await ctx.db.delete(a._id);

        const sess = await ctx.db
          .query("authSessions")
          .filter((q) => q.eq(q.field("userId"), u._id))
          .collect();
        for (const s of sess) await ctx.db.delete(s._id);

        await ctx.db.delete(u._id);
      }
    }

    return {
      admin: adminEmail,
      tenant: tenantEmail,
      deletedAccounts: deleted,
      totalRemaining: 2,
    };
  },
});

export const cleanAndSetupTwoAccounts = internalAction({
  args: {},
  handler: async (ctx) => {
    const scrypt = new Scrypt();
    const tenantSecret = await scrypt.hash("Kwame-Sankofa-2026!");
    return await ctx.runMutation(internal.migration.cleanAccountsAndCreateTenant, {
      adminEmail: "edimamfaidol@gmail.com",
      tenantEmail: "kwame.asante@example.com",
      tenantPasswordSecret: tenantSecret,
    });
  },
});
