import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const id = await getAuthUserId(ctx);
  if (!id) throw new Error("Not signed in");
  return id;
}
// Admin-only writes (e.g. app branding). Defense in depth: the UI also hides
// these controls from non-admins, but the server never trusts the client.
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await requireUser(ctx);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (!profile || profile.role !== "admin") throw new Error("Admin access required");
  return userId;
}
export async function nextNumber(ctx: MutationCtx, landlordId: Id<"users">, name: string, prefix: string) {
  const c = await ctx.db.query("counters").withIndex("by_name", q => q.eq("landlordId", landlordId).eq("name", name)).unique();
  const value = (c?.value ?? 1000) + 1;
  if (c) await ctx.db.patch(c._id, { value });
  else await ctx.db.insert("counters", { landlordId, name, value });
  return `${prefix}-${value}`;
}
