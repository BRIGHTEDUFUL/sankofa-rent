import { query, mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireAdmin, requireUser } from "./lib";
import { Scrypt } from "lucia";

// ─── Mutation: Public Password Reset Request ────────────────────────────────
export const requestReset = mutation({
  args: {
    email: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const norm = args.email.trim().toLowerCase();
    if (!norm.includes("@") || !norm.includes(".")) {
      throw new Error("Please enter a valid email address.");
    }

    // Find if user already exists
    const users = await ctx.db.query("users").collect();
    const existingUser = users.find((u) => u.email?.toLowerCase() === norm);

    // Check if there is already a pending request for this email
    const allPending = await ctx.db
      .query("passwordResetRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const existingPending = allPending.find((r) => r.email === norm);
    if (existingPending) {
      return {
        success: true,
        alreadyPending: true,
        message:
          "A password reset request is already pending for this email. Your administrator has been notified.",
      };
    }

    const requestId = await ctx.db.insert("passwordResetRequests", {
      userId: existingUser?._id,
      email: norm,
      note: args.note?.trim() || undefined,
      status: "pending",
      requestedAt: Date.now(),
    });

    return {
      success: true,
      alreadyPending: false,
      requestId,
      message:
        "Your password reset request has been sent to the administrator. They will issue a temporary password for your account.",
    };
  },
});

// ─── Query: List Reset Requests (Admin only) ────────────────────────────────
export const listRequests = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [requests, users, profiles] = await Promise.all([
      ctx.db.query("passwordResetRequests").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("profiles").collect(),
    ]);

    const userMap = new Map<string, (typeof users)[0]>();
    for (const u of users) {
      userMap.set(String(u._id), u);
      if (u.email) {
        userMap.set(u.email.toLowerCase(), u);
      }
    }

    const profileMap = new Map<string, (typeof profiles)[0]>();
    for (const p of profiles) {
      profileMap.set(String(p.userId), p);
    }

    return requests
      .map((r) => {
        const user = r.userId ? userMap.get(String(r.userId)) : userMap.get(r.email.toLowerCase());
        const prof = user ? profileMap.get(String(user._id)) : undefined;
        const fullName =
          `${prof?.firstName ?? ""} ${prof?.lastName ?? ""}`.trim() || (user?.email ?? r.email);

        return {
          _id: r._id,
          email: r.email,
          userId: user?._id ?? r.userId,
          userExists: Boolean(user),
          fullName,
          role: prof?.role ?? "user",
          phone: prof?.phone ?? "",
          note: r.note,
          status: r.status,
          adminNote: r.adminNote,
          temporaryPassword: r.temporaryPassword,
          requestedAt: r.requestedAt,
          resolvedAt: r.resolvedAt,
        };
      })
      .sort((a, b) => {
        // Pending first, then newest
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return b.requestedAt - a.requestedAt;
      });
  },
});

// ─── Query: Count Pending Reset Requests (Admin only) ───────────────────────
export const countPending = query({
  args: {},
  handler: async (ctx) => {
    const adminId = await requireAdmin(ctx);
    if (!adminId) return 0;
    const pending = await ctx.db
      .query("passwordResetRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return pending.length;
  },
});

// ─── Action: Admin fulfills request by setting temporary password ────────────
export const fulfillRequest = action({
  args: {
    requestId: v.id("passwordResetRequests"),
    temporaryPassword: v.string(),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const callerId = await requireUser(ctx);
    const isAdmin = await ctx.runQuery(internal.accounts.checkIsAdminInternal, {
      userId: callerId,
    });
    if (!isAdmin) {
      throw new Error("Admin access required to fulfill password reset requests.");
    }

    if (!args.temporaryPassword || args.temporaryPassword.length < 8) {
      throw new Error("Temporary password must be at least 8 characters long.");
    }

    const scrypt = new Scrypt();
    const secret = await scrypt.hash(args.temporaryPassword);

    await ctx.runMutation(internal.passwordReset.fulfillRequestInternal, {
      requestId: args.requestId,
      temporaryPassword: args.temporaryPassword,
      secret,
      adminId: callerId,
      adminNote: args.adminNote,
    });

    return {
      success: true,
      temporaryPassword: args.temporaryPassword,
    };
  },
});

// ─── Internal Mutation: Fulfill request and update auth ─────────────────────
export const fulfillRequestInternal = internalMutation({
  args: {
    requestId: v.id("passwordResetRequests"),
    temporaryPassword: v.string(),
    secret: v.string(),
    adminId: v.id("users"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Password reset request not found.");
    }

    // Locate the user
    let userId = request.userId;
    if (!userId) {
      const users = await ctx.db.query("users").collect();
      const matched = users.find((u) => u.email?.toLowerCase() === request.email.toLowerCase());
      if (matched) {
        userId = matched._id;
      }
    }

    if (!userId) {
      throw new Error(
        `No registered user account found for email "${request.email}". You can create an account for them in Accounts management.`,
      );
    }

    // Update or insert authAccounts
    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const passwordAccount = authAccounts.find((a) => a.provider === "password");
    if (passwordAccount) {
      await ctx.db.patch(passwordAccount._id, { secret: args.secret });
    } else {
      const user = await ctx.db.get(userId);
      await ctx.db.insert("authAccounts", {
        userId,
        provider: "password",
        providerAccountId: user?.email ?? String(userId),
        secret: args.secret,
      });
    }

    // Flag profile so user is prompted to set their own password when signing in
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, { mustChangePassword: true });
    }

    // Mark this request resolved
    await ctx.db.patch(request._id, {
      userId,
      status: "resolved",
      resolvedAt: Date.now(),
      resolvedBy: args.adminId,
      temporaryPassword: args.temporaryPassword,
      adminNote: args.adminNote?.trim() || undefined,
    });

    // Also mark any other pending requests for the same email as resolved
    const otherPending = await ctx.db
      .query("passwordResetRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    for (const other of otherPending) {
      if (other.email.toLowerCase() === request.email.toLowerCase() && other._id !== request._id) {
        await ctx.db.patch(other._id, {
          userId,
          status: "resolved",
          resolvedAt: Date.now(),
          resolvedBy: args.adminId,
          adminNote: "Resolved alongside primary request.",
        });
      }
    }

    return { success: true, userId };
  },
});

// ─── Mutation: Reject Request (Admin only) ──────────────────────────────────
export const rejectRequest = mutation({
  args: {
    requestId: v.id("passwordResetRequests"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Password reset request not found.");
    }

    await ctx.db.patch(request._id, {
      status: "rejected",
      resolvedAt: Date.now(),
      resolvedBy: adminId,
      adminNote: args.adminNote?.trim() || undefined,
    });

    return { success: true };
  },
});

// ─── Action: User completes mandatory temporary password change ─────────────
export const completeMustChangePassword = action({
  args: {
    newPassword: v.string(),
  },
  handler: async (ctx, { newPassword }) => {
    const userId = await requireUser(ctx);

    if (!newPassword || newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }

    const scrypt = new Scrypt();
    const secret = await scrypt.hash(newPassword);

    await ctx.runMutation(internal.passwordReset.clearMustChangePasswordInternal, {
      userId,
      secret,
    });

    return { success: true };
  },
});

// ─── Internal Mutation: Clear mustChangePassword flag ────────────────────────
export const clearMustChangePasswordInternal = internalMutation({
  args: {
    userId: v.id("users"),
    secret: v.string(),
  },
  handler: async (ctx, { userId, secret }) => {
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

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, { mustChangePassword: false });
    }

    return { success: true };
  },
});
