import { v } from "convex/values";

/** Currencies a landlord can choose for displaying and entering money. */
export const CURRENCY_CODES = ["GHS", "USD", "EUR", "GBP", "NGN", "XOF"] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];
export const DEFAULT_CURRENCY: CurrencyCode = "GHS";

export const currencyValidator = v.union(
  v.literal("GHS"),
  v.literal("USD"),
  v.literal("EUR"),
  v.literal("GBP"),
  v.literal("NGN"),
  v.literal("XOF"),
);
