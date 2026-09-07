import type { DateRange, RangeKey } from "@/types/analytics";
import {
  addDays,
  daysBetween,
  isValidIso,
  shiftYear,
  startOfYear,
  type IsoDate,
} from "./dates";

/**
 * Date ranges are server state: they live in the URL, are resolved here, and
 * flow into every query. Nothing downstream invents its own window.
 *
 * Ranges are anchored to the most recent day of data rather than to wall-clock
 * "today", so the numbers a reviewer sees always describe a complete dataset.
 */

export const RANGE_OPTIONS: Array<{ key: Exclude<RangeKey, "custom">; label: string }> = [
  { key: "last_30", label: "Last 30 days" },
  { key: "last_90", label: "Last 90 days" },
  { key: "ytd", label: "Year to date" },
  { key: "last_12m", label: "Last 12 months" },
];

export const DEFAULT_RANGE: RangeKey = "ytd";

/** <= 45 days reads well daily; a year only reads well monthly. */
function grainFor(days: number): DateRange["grain"] {
  if (days <= 45) return "day";
  if (days <= 180) return "week";
  return "month";
}

function boundsFor(key: Exclude<RangeKey, "custom">, anchor: IsoDate) {
  switch (key) {
    case "last_30":
      return { from: addDays(anchor, -29), to: anchor };
    case "last_90":
      return { from: addDays(anchor, -89), to: anchor };
    case "last_12m":
      return { from: addDays(shiftYear(anchor, -1), 1), to: anchor };
    case "ytd":
    default:
      return { from: startOfYear(anchor), to: anchor };
  }
}

export function resolveRange(
  params: { range?: string; from?: string; to?: string },
  anchor: IsoDate,
): DateRange {
  const custom =
    isValidIso(params.from) && isValidIso(params.to) && params.from <= params.to;

  const key: RangeKey = custom
    ? "custom"
    : (RANGE_OPTIONS.find((o) => o.key === params.range)?.key ?? DEFAULT_RANGE);

  const { from, to } = custom
    ? { from: params.from as IsoDate, to: params.to as IsoDate }
    : boundsFor(key as Exclude<RangeKey, "custom">, anchor);

  const days = daysBetween(from, to);
  const label = custom
    ? `${formatDay(from)} to ${formatDay(to)}`
    : (RANGE_OPTIONS.find((o) => o.key === key)?.label ?? "Year to date");

  return {
    key,
    from,
    to,
    label,
    days,
    grain: grainFor(days),
    comparison: {
      from: shiftYear(from, -1),
      to: shiftYear(to, -1),
      label: "same period last year",
    },
  };
}

/** Carries the active range across links so both screens stay in sync. */
export function rangeQuery(range: DateRange): string {
  const params =
    range.key === "custom"
      ? new URLSearchParams({ from: range.from, to: range.to })
      : new URLSearchParams({ range: range.key });
  return `?${params.toString()}`;
}

function formatDay(date: IsoDate): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
