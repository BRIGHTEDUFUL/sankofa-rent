import { describe, expect, it } from "vitest";
import { DEFAULT_BRANDING, contrastVsWhite, isHexColor, isUsableAccent } from "@/lib/branding";

describe("Branding defaults", () => {
  it("ships a readable default accent", () => {
    expect(DEFAULT_BRANDING.appName).toBe("Sankofa Rent");
    expect(DEFAULT_BRANDING.tagline.length).toBeGreaterThan(0);
    expect(isUsableAccent(DEFAULT_BRANDING.accentColor)).toBe(true);
  });
});

describe("Accent colour validation", () => {
  it("accepts only six-digit hex colours", () => {
    expect(isHexColor("#4E735A")).toBe(true);
    expect(isHexColor("#4e735a")).toBe(true);
    expect(isHexColor("#fff")).toBe(false);
    expect(isHexColor("4E735A")).toBe(false);
    expect(isHexColor("#4E735")).toBe(false);
    expect(isHexColor("#4E735G")).toBe(false);
    expect(isHexColor("")).toBe(false);
  });
  it("computes WCAG contrast against white", () => {
    expect(contrastVsWhite("#FFFFFF")).toBeCloseTo(1, 5);
    expect(contrastVsWhite("#000000")).toBeCloseTo(21, 1);
    // The default green must clear AA for white button text.
    expect(contrastVsWhite("#4E735A")).toBeGreaterThanOrEqual(4.5);
  });
  it("rejects colours too light for white text", () => {
    expect(isUsableAccent("#FFFF00")).toBe(false); // yellow
    expect(isUsableAccent("#ADD8E6")).toBe(false); // light blue
    expect(isUsableAccent("#2563EB")).toBe(true); // blue-600
    expect(isUsableAccent("not-a-colour")).toBe(false);
  });
});
