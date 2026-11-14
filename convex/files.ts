import { mutation } from "./_generated/server";
import { requireUser } from "./lib";

// Returns a short-lived upload URL. The caller must be signed in.
// Storage IDs returned by the client must be registered/verified before use.
export const generateUploadUrl = mutation({ args: {}, handler: async (ctx) => {
  await requireUser(ctx);
  return ctx.storage.generateUploadUrl();
}});
