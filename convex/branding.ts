import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib";

// Default identity of the app. Kept here (not only in the frontend) so the
// server can validate updates against the same limits and the UI can fall
// back to identical values while the first query is in flight.
export const DEFAULT_BRANDING = {
  appName: "Sankofa Rent",
  tagline: "Your property. Your peace of mind.",
  accentColor: "#4E735A",
} as const;

const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB

// --- validation (pure, mirrored by src/lib/branding.tsx for live feedback) ---

export function isHexColor(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

// WCAG 2.x relative luminance of a #rrggbb color.
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const r = channels[0] ?? 0;
  const g = channels[1] ?? 0;
  const b = channels[2] ?? 0;
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

// Contrast ratio of the color against white. Primary buttons use white text
// and `text-primary` sits on the light background, so anything below 4.5:1
// fails WCAG AA for normal text.
export function contrastVsWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

function assertBranding(args: { appName: string; tagline: string; accentColor: string }) {
  const appName = args.appName.trim();
  const tagline = args.tagline.trim();
  if (!appName) throw new Error("App name cannot be empty");
  if (appName.length > 60) throw new Error("App name must be 60 characters or fewer");
  if (!tagline) throw new Error("Tagline cannot be empty");
  if (tagline.length > 120) throw new Error("Tagline must be 120 characters or fewer");
  if (!isHexColor(args.accentColor)) throw new Error("Accent color must be a #rrggbb hex value");
  if (contrastVsWhite(args.accentColor) < 4.5) {
    throw new Error(
      "That accent color is too light — white text on it would be hard to read. Pick a darker shade.",
    );
  }
  return { appName, tagline, accentColor: args.accentColor.toLowerCase() };
}

// --- queries / mutations ---

// Public on purpose: the login and signup pages render before anyone is
// signed in, and branding is not sensitive data.
export const get = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("branding").first();
    if (!row) {
      return { ...DEFAULT_BRANDING, logoUrl: null, logoContentType: null };
    }
    const logoUrl = row.logoId ? await ctx.storage.getUrl(row.logoId) : null;
    return {
      appName: row.appName,
      tagline: row.tagline,
      accentColor: row.accentColor,
      logoUrl,
      logoContentType: row.logoContentType ?? null,
    };
  },
});

export const update = mutation({
  args: {
    appName: v.string(),
    tagline: v.string(),
    accentColor: v.string(),
    // undefined = keep the current logo; null = remove it.
    logoId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  handler: async (ctx, a) => {
    const adminId = await requireAdmin(ctx);
    const clean = assertBranding(a);

    const existing = await ctx.db.query("branding").first();

    // Resolve + validate a newly uploaded logo before it becomes the brand.
    let logoId = existing?.logoId;
    let logoContentType = existing?.logoContentType;
    if (a.logoId !== undefined) {
      if (a.logoId === null) {
        logoId = undefined;
        logoContentType = undefined;
      } else {
        const meta = await ctx.storage.getMetadata(a.logoId);
        if (!meta) throw new Error("Logo file not found — upload it again");
        if (!meta.contentType?.startsWith("image/")) {
          throw new Error("The logo file must be an image");
        }
        if (meta.size > MAX_LOGO_BYTES) {
          throw new Error("Logo must be 1 MB or smaller");
        }
        logoId = a.logoId;
        logoContentType = meta.contentType ?? undefined;
      }
    }

    const patch = {
      ...clean,
      logoId,
      logoContentType,
      updatedBy: adminId,
      updatedAt: Date.now(),
    };

    if (existing) {
      // Swap out the old file so replaced logos don't pile up in storage.
      const oldId = existing.logoId;
      await ctx.db.patch(existing._id, patch);
      if (oldId && oldId !== logoId) await ctx.storage.delete(oldId);
    } else {
      await ctx.db.insert("branding", patch);
    }
  },
});
