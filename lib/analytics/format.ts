/** Display formatting. No business values live here — only how they read. */

export function currency(value: number | null, options?: { cents?: boolean }): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: options?.cents ? 2 : 0,
    maximumFractionDigits: options?.cents ? 2 : 0,
  }).format(value);
}

export function count(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

/** 0.0392 -> "3.9%". Percentages below 10% keep one decimal, above it none. */
export function percent(value: number | null, forceDecimal = false): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const pct = value * 100;
  const decimals = forceDecimal || Math.abs(pct) < 10 ? 1 : 0;
  return `${pct.toFixed(decimals)}%`;
}

/** Signed change for a comparison, e.g. "+18%". */
export function signedPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const pct = value * 100;
  const decimals = Math.abs(pct) < 10 ? 1 : 0;
  return `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(decimals)}%`;
}

export function signedCount(value: number): string {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : "−"}${count(Math.abs(rounded))}`;
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
