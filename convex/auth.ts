import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

// Email + password sign-in. Add Google later if needed (see docs/CONVEX_MIGRATION.md).
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      if (existing) return;
      await ctx.db.insert("profiles", {
        userId, firstName: "", lastName: "", currency: "GHS", rentDueDay: 5,
        notifySms: true, notifyEmail: true, notifyWhatsapp: false, plan: "free",
      });
    },
  },
});
