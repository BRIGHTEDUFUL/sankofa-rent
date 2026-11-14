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
  const cedi = Number(value);
  if (!Number.isFinite(cedi) || cedi <= 0) return NaN;
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
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const PAYMENT_METHODS: Record<string, string> = {
  mtn_momo: "MTN MoMo",
  telecel_cash: "Telecel Cash",
  airteltigo_money: "AirtelTigo Money",
  bank: "Bank transfer",
  cash: "Cash",
};
