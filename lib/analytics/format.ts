/** Display formatting. No business values live here, only how they read. */

/**
 * What a figure reads as when there is nothing to divide by. Spelled out
 * rather than punctuated, so it means something on its own and to a screen
 * reader.
 */
const NOT_AVAILABLE = "Not available";

export function currency(value: number | null, options?: { cents?: boolean }): string {
  if (value === null || !Number.isFinite(value)) return NOT_AVAILABLE;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: options?.cents ? 2 : 0,
    maximumFractionDigits: options?.cents ? 2 : 0,
  }).format(value);
}

/** 96,668 -> "96.7K". Used where the exact figure is not the point. */
export function compactCount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return NOT_AVAILABLE;
  if (Math.abs(value) < 1000) return count(value);
  const thousands = value / 1000;
  return `${thousands >= 100 ? Math.round(thousands) : thousands.toFixed(1)}K`;
}

/** $45,190 -> "$45.2K". */
export function compactCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return NOT_AVAILABLE;
  if (Math.abs(value) < 1000) return currency(value);
  const thousands = value / 1000;
  return `$${thousands >= 100 ? Math.round(thousands) : thousands.toFixed(1)}K`;
}

export function count(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return NOT_AVAILABLE;
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

/** 0.0392 -> "3.9%". Percentages below 10% keep one decimal, above it none. */
export function percent(value: number | null, forceDecimal = false): string {
  if (value === null || !Number.isFinite(value)) return NOT_AVAILABLE;
  const pct = value * 100;
  const decimals = forceDecimal || Math.abs(pct) < 10 ? 1 : 0;
  return `${pct.toFixed(decimals)}%`;
}

/** Signed change for a comparison, e.g. "+18%". */
export function signedPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return NOT_AVAILABLE;
  const pct = value * 100;
  const decimals = Math.abs(pct) < 10 ? 1 : 0;
  return `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(decimals)}%`;
}

/** "1 booking", "12 bookings". */
export function plural(value: number, singular: string, pluralForm?: string): string {
  return `${count(value)} ${Math.round(value) === 1 ? singular : (pluralForm ?? `${singular}s`)}`;
}

export function shortDate(iso: string, timeZone = "UTC"): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  });
}

export function longDate(iso: string, timeZone = "UTC"): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
}

/** Axis and tooltip labels adapt to how the chart is bucketed. */
export function bucketLabel(iso: string, grain: "day" | "week" | "month"): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (grain === "month") {
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
  }
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return grain === "week" ? `Week of ${day}` : day;
}
