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
