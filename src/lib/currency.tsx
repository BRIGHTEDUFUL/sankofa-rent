import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  cediFromPesewas,
  currencyLabel,
  currencySymbol,
  DEFAULT_CURRENCY,
  isCurrencyCode,
  parseMoney,
  type CurrencyCode,
} from "./format";

/**
 * The signed-in landlord's display currency. Falls back to GHS while the
 * profile is loading and on public pages (login, signup, notices).
 */
export function useCurrency(): CurrencyCode {
  const profile = useQuery(api.profiles.me, {});
  const code = profile?.currency;
  return code && isCurrencyCode(code) ? code : DEFAULT_CURRENCY;
}

/**
 * Currency-aware money helpers for a screen. `money()` formats integer minor
 * units; `parse()` turns typed input back into minor units (it accepts any of
 * the supported currency marks).
 */
export function useMoney() {
  const currency = useCurrency();
  return {
    currency,
    label: currencyLabel(currency),
    symbol: currencySymbol(currency),
    money: (minor: number) => cediFromPesewas(minor, currency),
    parse: parseMoney,
  };
}
