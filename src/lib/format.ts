// Convex stores money as integer pesewas (GH₵ 1 = 100) and dates as epoch ms.
export function cediFromPesewas(pesewas: number): string {
  return (
    "GH₵ " +
    (pesewas / 100).toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Parse a cedi amount typed in the UI into integer pesewas. Returns NaN when invalid. */
export function pesewasFromCedi(value: string): number {
  // Tolerate what people actually type and what our placeholders show:
  // "1,600", "GH₵ 1,600.00", "GHS 1600" — strip currency marks, commas, spaces.
  const normalized = value
    .trim()
    .replace(/(gh₵|₵|ghc|ghs)/gi, "")
    .replace(/[,\s]/g, "");
  const cedi = Number(normalized);
  if (!Number.isFinite(cedi) || cedi < 0) return NaN;
  return Math.round(cedi * 100);
}

/** Parse an HTML date input (YYYY-MM-DD) into epoch ms at UTC midnight. */
export function msFromDateInput(value: string): number {
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(ms) ? NaN : ms;
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
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

export function initials(name: string): string {
  const result = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return result || "?";
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
