/**
 * Calendar helpers over plain YYYY-MM-DD strings.
 *
 * The dashboard reasons about days in the property's timezone, and Postgres
 * does the timezone conversion when filtering bookings. Keeping dates as
 * strings here avoids a second, subtly different notion of "today".
 */

export type IsoDate = string;

const DAY_MS = 86_400_000;

export function parseIso(date: IsoDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function toIso(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return toIso(new Date(parseIso(date).getTime() + days * DAY_MS));
}

/** Inclusive day count. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / DAY_MS) + 1;
}

/** Same calendar date one year earlier; Feb 29 falls back to Feb 28. */
export function shiftYear(date: IsoDate, years: number): IsoDate {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y + years, m - 1, d));
  if (target.getUTCMonth() !== m - 1) {
    // e.g. Feb 29 -> Mar 1 after the shift; pull it back into February.
    target.setUTCDate(0);
  }
  return toIso(target);
}

export function startOfYear(date: IsoDate): IsoDate {
  return `${date.slice(0, 4)}-01-01`;
}

export function isValidIso(value: unknown): value is IsoDate {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parseIso(value).getTime())
  );
}
