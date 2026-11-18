// Convex stores money as integer minor units (100 per major unit — pesewas for
// GHS, cents for USD, etc.), and dates as epoch ms. Each landlord picks the
// currency used for display and entry; stored amounts are never converted.
export const CURRENCIES = {
  GHS: { code: "GHS", symbol: "GH₵", label: "Ghana cedi", spaced: true },
  USD: { code: "USD", symbol: "$", label: "US dollar", spaced: false },
  EUR: { code: "EUR", symbol: "€", label: "Euro", spaced: false },
  GBP: { code: "GBP", symbol: "£", label: "British pound", spaced: false },
  NGN: { code: "NGN", symbol: "₦", label: "Nigerian naira", spaced: false },
  XOF: { code: "XOF", symbol: "CFA", label: "West African CFA franc", spaced: true },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];
export const DEFAULT_CURRENCY: CurrencyCode = "GHS";

export function isCurrencyCode(value: string): value is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, value);
}

export function currencyLabel(code?: string | null): string {
  return code && isCurrencyCode(code) ? CURRENCIES[code].label : (code ?? "Ghana cedi");
}

export function currencySymbol(code?: string | null): string {
  return code && isCurrencyCode(code) ? CURRENCIES[code].symbol : CURRENCIES.GHS.symbol;
}

/** Format integer minor units with the landlord's currency symbol. */
export function formatMoney(minor: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const c = CURRENCIES[currency] ?? CURRENCIES.GHS;
  const amount = (minor / 100).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${c.symbol}${c.spaced ? " " : ""}${amount}`;
}

/** Backwards-compatible name used across the app; `currency` defaults to GHS. */
export function cediFromPesewas(
  pesewas: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  return formatMoney(pesewas, currency);
}

// Any currency mark a user might paste into an amount field, in any case.
const CURRENCY_MARKS = /(gh₵|₵|ghc|ghs|usd|eur|gbp|ngn|xof|cfa|[$€£₦])/gi;

/** Parse an amount typed in the UI into integer minor units. Returns NaN when invalid. */
export function parseMoney(value: string): number {
  // Tolerate what people actually type and what our placeholders show:
  // "1,600", "GH₵ 1,600.00", "$1600", "GHS 1,600", "CFA 1,600" — strip marks.
  const normalized = value.trim().replace(CURRENCY_MARKS, "").replace(/[,\s]/g, "");
  const amount = Number(normalized);
  // Zero is rejected too: a zero-amount invoice, rent or deposit is always a
  // data-entry mistake, and it silently skews every total in the app.
  if (!Number.isFinite(amount) || amount <= 0) return NaN;
  return Math.round(amount * 100);
}

/** Backwards-compatible name; parsing is currency-agnostic. */
export function pesewasFromCedi(value: string): number {
  return parseMoney(value);
}

/** Parse an HTML date input (YYYY-MM-DD) into epoch ms at UTC midnight. */
export function msFromDateInput(value: string): number {
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(ms) ? NaN : ms;
}

export function formatDate(ms?: number | null): string {
  if (!ms || Number.isNaN(ms)) return "—";
  try {
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "—";
  }
}

export function formatDateTime(ms?: number | null): string {
  if (!ms || Number.isNaN(ms)) return "—";
  try {
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-GH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  } catch {
    return "—";
  }
}

export function formatMonth(period: string): string {
  // period is "YYYY-MM"
  const [year, month] = period.split("-");
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const idx = Number(month) - 1;
  const label = names[idx] ?? month ?? "";
  return year ? `${label} ${year}` : period;
}

export function initials(name?: string | null): string {
  if (!name || typeof name !== "string") return "?";
  const result = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return result || "?";
}

/** "1 property" / "2 properties" — keeps count labels grammatical. */
export function plural(count: number, singular: string, many = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : many}`;
}

export const PAYMENT_METHODS: Record<string, string> = {
  mtn_momo: "MTN MoMo",
  telecel_cash: "Telecel Cash",
  airteltigo_money: "AirtelTigo Money",
  bank: "Bank transfer",
  cash: "Cash",
};

/**
 * Turn a Convex client error into the message the server actually wrote.
 * The raw shape is "[CONVEX M(name)] [Request ID: …] Server Error\nUncaught
 * Error: <message>\n  at handler …" — this surfaces just "<message>".
 */
export function friendlyError(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const raw = err instanceof Error ? err.message : String(err);
  const uncaught = raw.match(/Uncaught Error: ([^\n]+)/);
  const message = (uncaught?.[1] ?? raw.split("\n")[0] ?? "").trim();
  if (message === "" || message === "undefined" || message === "null") return fallback;
  return message;
}
