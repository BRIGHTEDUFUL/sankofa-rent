import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireAdmin, requireUser } from "./lib";
import { Scrypt } from "lucia";

// ─── Query: List all accounts (Admins only) ──────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await requireAdmin(ctx);

    const [users, profiles, properties, tenants] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("profiles").collect(),
      ctx.db.query("properties").collect(),
      ctx.db.query("tenants").collect(),
    ]);

    const propertyCounts = new Map<string, number>();
    for (const p of properties) {
      const id = String(p.landlordId);
      propertyCounts.set(id, (propertyCounts.get(id) ?? 0) + 1);
    }

    const tenantCounts = new Map<string, number>();
    for (const t of tenants) {
      const id = String(t.landlordId);
      tenantCounts.set(id, (tenantCounts.get(id) ?? 0) + 1);
    }

    const profileMap = new Map<string, (typeof profiles)[0]>();
    for (const prof of profiles) {
      profileMap.set(String(prof.userId), prof);
    }

    return users
      .map((u) => {
        const prof = profileMap.get(String(u._id));
        const role = prof?.role === "admin" ? "admin" : "user";
        return {
          userId: u._id,
          profileId: prof?._id,
          email: u.email ?? "",
          firstName: prof?.firstName ?? "",
          lastName: prof?.lastName ?? "",
          fullName:
            `${prof?.firstName ?? ""} ${prof?.lastName ?? ""}`.trim() ||
            (u.email ?? "Unnamed Account"),
          role,
          phone: prof?.phone ?? "",
          businessName: prof?.businessName ?? "",
          region: prof?.region ?? "",
          propertiesCount: propertyCounts.get(String(u._id)) ?? 0,
          tenantsCount: tenantCounts.get(String(u._id)) ?? 0,
          createdAt: u._creationTime,
          isCurrentUser: u._id === currentUserId,
        };
      })
      .sort((a, b) => {
        // Sort current user first, then other admins, then date desc
        if (a.isCurrentUser) return -1;
        if (b.isCurrentUser) return 1;
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (a.role !== "admin" && b.role === "admin") return 1;
        return b.createdAt - a.createdAt;
      });
  },
});

// ─── Mutation: Update user role (Promote to Admin / Demote to User) ─────────
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, { userId, role }) => {
    await requireAdmin(ctx);

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!targetProfile) {
      throw new Error("Target user profile not found");
    }

    // Safety guard: if demoting an admin, ensure at least one OTHER admin exists
    if (targetProfile.role === "admin" && role === "user") {
      const allProfiles = await ctx.db.query("profiles").collect();
      const adminCount = allProfiles.filter((p) => p.role === "admin").length;
      if (adminCount <= 1) {
        throw new Error(
          "Cannot demote the last remaining administrator. The system must retain at least one admin.",
        );
      }
    }

    await ctx.db.patch(targetProfile._id, { role });
    return { success: true, userId, role };
  },
});

// ─── Internal helpers ────────────────────────────────────────────────────────
export const checkIsAdminInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const prof = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return prof?.role === "admin";
  },
});

export const getPasswordSecretInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    const pw = authAccounts.find((a) => a.provider === "password");
    return pw?.secret ?? null;
  },
});

export const insertAccountInternal = internalMutation({
  args: {
    email: v.string(),
    secret: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    businessName: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const norm = args.email.trim().toLowerCase();

    const existingUser = (await ctx.db.query("users").collect()).find(
      (u) => u.email?.toLowerCase() === norm,
    );
    if (existingUser) {
      throw new Error(`An account with email ${norm} already exists`);
    }

    const userId = await ctx.db.insert("users", { email: norm });
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: norm,
      secret: args.secret,
    });

    const profileId = await ctx.db.insert("profiles", {
      userId,
      role: args.role,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      phone: args.phone?.trim() || undefined,
      businessName: args.businessName?.trim() || undefined,
      region: args.region?.trim() || "Greater Accra",
      currency: "GHS",
      rentDueDay: 5,
      notifySms: true,
      notifyEmail: true,
      notifyWhatsapp: false,
      plan: "free",
    });

    return { userId, profileId, email: norm };
  },
});

export const updatePasswordSecretInternal = internalMutation({
  args: {
    userId: v.id("users"),
    secret: v.string(),
  },
  handler: async (ctx, { userId, secret }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const passwordAccount = authAccounts.find((a) => a.provider === "password");
    if (passwordAccount) {
      await ctx.db.patch(passwordAccount._id, { secret });
    } else {
      await ctx.db.insert("authAccounts", {
        userId,
        provider: "password",
        providerAccountId: user.email ?? String(userId),
        secret,
      });
    }

    // Set mustChangePassword: true so the user is prompted to set their own password
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, { mustChangePassword: true });
    }

    // Resolve any pending reset requests for this user/email
    if (user.email) {
      const pendingRequests = await ctx.db
        .query("passwordResetRequests")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect();

      for (const pr of pendingRequests) {
        if (pr.email.toLowerCase() === user.email.toLowerCase() || pr.userId === userId) {
          await ctx.db.patch(pr._id, {
            userId,
            status: "resolved",
            resolvedAt: Date.now(),
            adminNote: "Resolved via Account Management reset.",
          });
        }
      }
    }

    return { success: true };
  },
});

export const updateOwnPasswordInternal = internalMutation({
  args: {
    userId: v.id("users"),
    secret: v.string(),
  },
  handler: async (ctx, { userId, secret }) => {
    const currentUserId = await requireUser(ctx);
    if (currentUserId !== userId) {
      throw new Error("Unauthorized to change password for another account.");
    }

    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const passwordAccount = authAccounts.find((a) => a.provider === "password");
    if (passwordAccount) {
      await ctx.db.patch(passwordAccount._id, { secret });
    } else {
      const user = await ctx.db.get(userId);
      await ctx.db.insert("authAccounts", {
        userId,
        provider: "password",
        providerAccountId: user?.email ?? String(userId),
        secret,
      });
    }

    // Clear mustChangePassword if it was set
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (profile && profile.mustChangePassword) {
      await ctx.db.patch(profile._id, { mustChangePassword: false });
    }

    return { success: true };
  },
});

// ─── Action: Create New Account (Admin provisioned) ──────────────────────────
export const createAccount = action({
  args: {
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    businessName: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const callerId = await requireUser(ctx);
    const isAdmin = await ctx.runQuery(internal.accounts.checkIsAdminInternal, {
      userId: callerId,
    });
    if (!isAdmin) {
      throw new Error("Admin access required to create accounts.");
    }

    const emailNorm = args.email.trim().toLowerCase();
    if (!emailNorm.includes("@") || !emailNorm.includes(".")) {
      throw new Error("Please provide a valid email address.");
    }
    if (!args.password || args.password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    if (!args.firstName.trim()) {
      throw new Error("First name is required.");
    }

    const scrypt = new Scrypt();
    const secret = await scrypt.hash(args.password);

    return await ctx.runMutation(internal.accounts.insertAccountInternal, {
      email: emailNorm,
      secret,
      role: args.role,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      businessName: args.businessName,
      region: args.region,
    });
  },
});

// ─── Action: Reset Account Password (Admin action) ───────────────────────────
export const resetPassword = action({
  args: {
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, { userId, newPassword }) => {
    const callerId = await requireUser(ctx);
    const isAdmin = await ctx.runQuery(internal.accounts.checkIsAdminInternal, {
      userId: callerId,
    });
    if (!isAdmin) {
      throw new Error("Admin access required to reset passwords.");
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }

    const scrypt = new Scrypt();
    const secret = await scrypt.hash(newPassword);

    await ctx.runMutation(internal.accounts.updatePasswordSecretInternal, {
      userId,
      secret,
    });

    return { success: true };
  },
});

// ─── Action: Change Current User's Own Password ──────────────────────────────
export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, { currentPassword, newPassword }) => {
    const userId = await requireUser(ctx);

    if (!newPassword || newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }

    const secret = await ctx.runQuery(internal.accounts.getPasswordSecretInternal, {
      userId,
    });
    if (!secret) {
      throw new Error("No password credentials found for this account.");
    }

    const scrypt = new Scrypt();
    const valid = await scrypt.verify(secret, currentPassword);
    if (!valid) {
      throw new Error("Incorrect current password.");
    }

    const newSecret = await scrypt.hash(newPassword);
    await ctx.runMutation(internal.accounts.updateOwnPasswordInternal, {
      userId,
      secret: newSecret,
    });

    return { success: true };
  },
});

// ─── Mutation: Delete Account ────────────────────────────────────────────────
export const deleteAccount = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const callerId = await requireAdmin(ctx);

    if (callerId === userId) {
      throw new Error("You cannot delete your own active administrator account.");
    }

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (targetProfile?.role === "admin") {
      const allProfiles = await ctx.db.query("profiles").collect();
      const adminCount = allProfiles.filter((p) => p.role === "admin").length;
      if (adminCount <= 1) {
        throw new Error("Cannot delete the only remaining administrator account.");
      }
    }

    // Check if user owns properties
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_landlord", (q) => q.eq("landlordId", userId))
      .collect();

    if (properties.length > 0) {
      throw new Error(
        `Cannot delete account: this landlord owns ${properties.length} active propert${
          properties.length === 1 ? "y" : "ies"
        }. Please reassign or delete their properties first.`,
      );
    }

    // Delete profile
    if (targetProfile) {
      await ctx.db.delete(targetProfile._id);
    }

    // Delete authAccounts
    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const a of authAccounts) {
      await ctx.db.delete(a._id);
    }

    // Delete authSessions
    const authSessions = await ctx.db
      .query("authSessions")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const s of authSessions) {
      await ctx.db.delete(s._id);
    }

    // Delete user
    await ctx.db.delete(userId);

    return { success: true, deletedUserId: userId };
  },
});
