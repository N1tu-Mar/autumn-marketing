import type {
  CampaignBreakdown,
  ComparedMetrics,
  Delta,
  MarketBreakdown,
  PeriodMetrics,
} from "@/types/analytics";
import type {
  CampaignPerformanceRow,
  FeederMarketRow,
  OverviewMetricsRow,
} from "@/types/database";

/**
 * One definition per metric, used by both screens.
 *
 * Nothing in here holds a value of its own — every function takes rows that
 * came out of Postgres. Rates are null rather than zero when the denominator
 * is zero, so the UI can say "not comparable" instead of showing a fake 0%.
 */

const num = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

export function toPeriodMetrics(row: OverviewMetricsRow | undefined): PeriodMetrics {
  const impressions = num(row?.impressions);
  const clicks = num(row?.clicks);
  const websiteVisits = num(row?.website_visits);
  const adSpend = num(row?.ad_spend);
  const bookings = num(row?.bookings);
  const bookingRevenue = num(row?.booking_revenue);

  return {
    impressions,
    clicks,
    websiteVisits,
    adSpend,
    bookings,
    bookingRevenue,
    roomNights: num(row?.room_nights),
    clickThroughRate: ratio(clicks, impressions),
    bookingRate: ratio(bookings, websiteVisits),
    averageBookingValue: ratio(bookingRevenue, bookings),
    returnOnAdSpend: ratio(bookingRevenue, adSpend),
  };
}

export function delta(current: number | null, previous: number | null): Delta {
  const now = current ?? 0;
  const before = previous ?? 0;
  const comparable = previous !== null && previous !== 0;
  const change = comparable ? (now - before) / Math.abs(before) : null;

  return {
    current: now,
    previous: before,
    ratio: change,
    absolute: now - before,
    direction:
      change === null || Math.abs(change) < 0.005 ? "flat" : change > 0 ? "up" : "down",
  };
}

export function compareMetrics(
  currentRow: OverviewMetricsRow | undefined,
  previousRow: OverviewMetricsRow | undefined,
): ComparedMetrics {
  const current = toPeriodMetrics(currentRow);
  const previous = toPeriodMetrics(previousRow);

  return {
    current,
    previous,
    revenue: delta(current.bookingRevenue, previous.bookingRevenue),
    bookings: delta(current.bookings, previous.bookings),
    websiteVisits: delta(current.websiteVisits, previous.websiteVisits),
    impressions: delta(current.impressions, previous.impressions),
    averageBookingValue: delta(
      current.averageBookingValue,
      previous.averageBookingValue,
    ),
    bookingRate: delta(current.bookingRate, previous.bookingRate),
  };
}

export function toCampaignBreakdown(
  rows: CampaignPerformanceRow[],
): CampaignBreakdown[] {
  const totalRevenue = rows.reduce((sum, r) => sum + num(r.booking_revenue), 0);

  return rows
    .map((row) => {
      const impressions = num(row.impressions);
      const clicks = num(row.clicks);
      const websiteVisits = num(row.website_visits);
      const bookings = num(row.bookings);
      const revenue = num(row.booking_revenue);

      return {
        ...row,
        impressions,
        clicks,
        website_visits: websiteVisits,
        ad_spend: num(row.ad_spend),
        bookings,
        booking_revenue: revenue,
        revenueShare: totalRevenue > 0 ? revenue / totalRevenue : 0,
        clickThroughRate: ratio(clicks, impressions),
        bookingRate: ratio(bookings, websiteVisits),
        averageBookingValue: ratio(revenue, bookings),
      };
    })
    .sort((a, b) => b.booking_revenue - a.booking_revenue);
}

export function toMarketBreakdown(
  rows: FeederMarketRow[],
  comparisonRows: FeederMarketRow[],
): MarketBreakdown[] {
  const totalRevenue = rows.reduce((sum, r) => sum + num(r.booking_revenue), 0);
  const priorByCity = new Map(
    comparisonRows.map((r) => [r.guest_city, num(r.booking_revenue)]),
  );

  return rows
    .map((row) => {
      const revenue = num(row.booking_revenue);
      const prior = priorByCity.get(row.guest_city);
      return {
        ...row,
        bookings: num(row.bookings),
        booking_revenue: revenue,
        room_nights: num(row.room_nights),
        revenueShare: totalRevenue > 0 ? revenue / totalRevenue : 0,
        revenueDelta: prior === undefined ? null : delta(revenue, prior),
      };
    })
    .sort((a, b) => b.booking_revenue - a.booking_revenue);
}

/**
 * Collapses a long tail into a single "Other markets" row so the ranked list
 * stays readable. The remainder is summed, never dropped.
 */
export function withOtherMarkets(
  markets: MarketBreakdown[],
  keep: number,
): { top: MarketBreakdown[]; other: { bookings: number; revenue: number; share: number } | null } {
  if (markets.length <= keep + 1) return { top: markets, other: null };

  const top = markets.slice(0, keep);
  const rest = markets.slice(keep);
  return {
    top,
    other: {
      bookings: rest.reduce((s, m) => s + m.bookings, 0),
      revenue: rest.reduce((s, m) => s + m.booking_revenue, 0),
      share: rest.reduce((s, m) => s + m.revenueShare, 0),
    },
  };
}
