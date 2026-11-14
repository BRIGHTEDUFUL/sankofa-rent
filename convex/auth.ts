import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

// Email + password sign-in. Add Google later if needed (see docs/CONVEX_MIGRATION.md).
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      // The library types this ctx with system indexes only, so look the
      // profile up with a filter instead of the by_user index (one tiny table).
      const existing = await ctx.db
        .query("profiles")
        .filter((q) => q.eq(q.field("userId"), userId))
        .unique();
      if (existing) return;
      // First account on a fresh deployment becomes the admin (may edit
      // branding); everyone after is a regular user. See convex/migration.ts
      // for backfilling this rule onto deployments created before roles existed.
      const anyProfile = await ctx.db.query("profiles").first();
      await ctx.db.insert("profiles", {
        userId,
        role: anyProfile ? "user" : "admin",
        firstName: "",
        lastName: "",
        currency: "GHS",
        rentDueDay: 5,
        notifySms: true,
        notifyEmail: true,
        notifyWhatsapp: false,
        plan: "free",
      });
    },
  },
});
