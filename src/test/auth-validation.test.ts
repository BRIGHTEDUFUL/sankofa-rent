import { describe, expect, it } from "vitest";
import { validatePassword, validateResetCode } from "@/lib/auth-validation";

describe("Auth form validation", () => {
  it("requires at least eight password characters", () => {
    expect(validatePassword("1234567")).toBeDefined();
    expect(validatePassword("12345678")).toBeUndefined();
  });
  it("requires matching password confirmation", () => {
    expect(validatePassword("long-password", "different-password")).toBeDefined();
    expect(validatePassword("long-password", "long-password")).toBeUndefined();
  });
  it("accepts only an eight-digit reset code for the Convex OTP handoff", () => {
    expect(validateResetCode("12345678")).toBeUndefined();
    for (const invalid of ["1234567", "123456789", "abcdefgh", "1234 678"]) {
      expect(validateResetCode(invalid)).toBeDefined();
    }
  });
});