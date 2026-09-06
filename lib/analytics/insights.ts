import type {
  CampaignBreakdown,
  ComparedMetrics,
  DateRange,
  Insight,
  MarketBreakdown,
} from "@/types/analytics";
import { compactCurrency, currency, percent, signedPercent } from "./format";

/**
 * Rule-based insights.
 *
 * These exist to explain the headline, never to restate it. "Revenue is up
 * 26%" is already the largest thing on the screen, so it is not an insight —
 * *which market* and *which strategy* produced that change is. Sentence
 * templates and thresholds live in code; every number, market and campaign
 * name inside them comes from a query.
 */

const THRESHOLDS = {
  visitsSurge: 0.15,
  conversionDrop: -0.1,
  marketGrowth: 0.2,
  marketDecline: -0.25,
  campaignShare: 0.35,
  stayLength: 0.06,
  bookingValue: 0.08,
  steady: 0.05,
};

const MIN_BOOKINGS_FOR_MARKET_INSIGHT = 5;

/** At most two. A third only earns its place if the first two are thin. */
const MAX_INSIGHTS = 2;

export function generateInsights(input: {
  metrics: ComparedMetrics;
  campaigns: CampaignBreakdown[];
  markets: MarketBreakdown[];
  range: DateRange;
}): Insight[] {
  const { metrics, campaigns, markets } = input;
  const { current, previous } = metrics;

  if (current.bookings === 0 && current.impressions === 0) return [];

  const candidates: Insight[] = [];

  /* -- a genuine problem outranks anything else --------------------------- */

  const visitsUp = metrics.websiteVisits.ratio;
  const rateChange = metrics.bookingRate.ratio;
  if (
    visitsUp !== null &&
    rateChange !== null &&
    visitsUp >= THRESHOLDS.visitsSurge &&
    rateChange <= THRESHOLDS.conversionDrop
  ) {
    candidates.push({
      id: "traffic-up-conversion-down",
      topic: "conversion",
      tone: "concern",
      title: "More travelers are visiting, but fewer are booking",
      detail:
        `Website visits rose ${signedPercent(visitsUp)}, while the share of visitors who booked ` +
        `slipped from ${percent(previous.bookingRate)} to ${percent(current.bookingRate)}.`,
    });
  }

  /* -- what actually moved the result ------------------------------------ */

  // The market that contributed the most new revenue, not just the biggest one.
  const risingMarket = [...markets]
    .filter(
      (m) =>
        m.bookings >= MIN_BOOKINGS_FOR_MARKET_INSIGHT &&
        m.revenueDelta !== null &&
        m.revenueDelta.ratio !== null &&
        m.revenueDelta.ratio >= THRESHOLDS.marketGrowth,
    )
    .sort((a, b) => (b.revenueDelta?.absolute ?? 0) - (a.revenueDelta?.absolute ?? 0))[0];

  if (risingMarket) {
    candidates.push({
      id: `market-growth-${risingMarket.guest_city}`,
      topic: "market",
      tone: "positive",
      title: `${risingMarket.guest_city} led the growth`,
      detail:
        `Travelers from ${risingMarket.guest_city} booked ${compactCurrency(risingMarket.booking_revenue)} of direct revenue, ` +
        `${signedPercent(risingMarket.revenueDelta?.ratio ?? null)} against the same period last year.`,
    });
  }

  const fallingMarket = [...markets]
    .filter(
      (m) =>
        m.revenueDelta !== null &&
        m.revenueDelta.ratio !== null &&
        m.revenueDelta.ratio <= THRESHOLDS.marketDecline &&
        m.revenueDelta.previous > 0,
    )
    .sort((a, b) => (a.revenueDelta?.absolute ?? 0) - (b.revenueDelta?.absolute ?? 0))[0];

  if (fallingMarket && !risingMarket) {
    candidates.push({
      id: `market-decline-${fallingMarket.guest_city}`,
      topic: "market",
      tone: "concern",
      title: `${fallingMarket.guest_city} sent fewer guests`,
      detail:
        `Revenue from ${fallingMarket.guest_city} fell ${signedPercent(fallingMarket.revenueDelta?.ratio ?? null)} ` +
        `to ${compactCurrency(fallingMarket.booking_revenue)}.`,
    });
  }

  const topCampaign = campaigns[0];
  if (topCampaign && topCampaign.revenueShare >= THRESHOLDS.campaignShare) {
    candidates.push({
      id: `campaign-${topCampaign.campaign_id}`,
      topic: "campaign",
      tone: "neutral",
      title: `${topCampaign.campaign_name} was your strongest strategy`,
      detail:
        `It produced ${percent(topCampaign.revenueShare)} of direct booking revenue, ` +
        `${compactCurrency(topCampaign.booking_revenue)} in total.`,
    });
  }

  // When revenue outruns booking count, the reason is the booking itself.
  const valueChange = metrics.averageBookingValue.ratio;
  const stayChange = metrics.averageStayNights.ratio;
  if (stayChange !== null && stayChange >= THRESHOLDS.stayLength) {
    candidates.push({
      id: "longer-stays",
      topic: "stay",
      tone: "positive",
      title: "Guests are booking longer stays",
      detail:
        `The average stay grew from ${previous.averageStayNights?.toFixed(1)} to ` +
        `${current.averageStayNights?.toFixed(1)} nights, lifting the value of each booking.`,
    });
  } else if (valueChange !== null && valueChange >= THRESHOLDS.bookingValue) {
    candidates.push({
      id: "higher-booking-value",
      topic: "stay",
      tone: "positive",
      title: "Each booking is worth more",
      detail:
        `The average booking rose to ${currency(current.averageBookingValue)}, ` +
        `${signedPercent(valueChange)} against the same period last year.`,
    });
  }

  /* -- a calm answer when nothing really moved --------------------------- */

  if (candidates.length === 0) {
    const revenueChange = metrics.revenue.ratio;
    candidates.push({
      id: "steady",
      topic: "steady",
      tone: "neutral",
      title: "Nothing moved much this period",
      detail:
        revenueChange === null
          ? `${currency(current.bookingRevenue)} in direct booking revenue. There is no comparable period last year yet.`
          : `Direct booking revenue is within ${percent(Math.abs(revenueChange), true)} of the same period last year, and no market or strategy shifted materially.`,
    });
  }

  return candidates.slice(0, MAX_INSIGHTS);
}

/* --------------------------------------------------------- hero status ---- */

/**
 * The spoken line at the top. It has to agree with the range the owner picked:
 * "a strong season" is wrong when the filter says Last 30 days.
 */

type Tier = "strong" | "growing" | "steady" | "softening";

const STATUS: Record<Tier, Record<string, string>> = {
  strong: {
    last_30: "You've had a strong month.",
    last_90: "Your recent booking performance is strong.",
    ytd: "You're having a strong year.",
    last_12m: "Direct bookings are well ahead of last year.",
    custom: "You've had a strong stretch.",
  },
  growing: {
    last_30: "Your direct bookings grew this month.",
    last_90: "Your direct bookings are growing.",
    ytd: "Your direct bookings are growing this year.",
    last_12m: "Direct bookings are trending ahead of last year.",
    custom: "Your direct bookings are growing.",
  },
  steady: {
    last_30: "Booking performance held steady this month.",
    last_90: "Recent booking performance is steady.",
    ytd: "Booking performance is steady this year.",
    last_12m: "Direct bookings are level with last year.",
    custom: "Booking performance is steady.",
  },
  softening: {
    last_30: "Direct bookings softened this month.",
    last_90: "Direct bookings have softened recently.",
    ytd: "Direct bookings are behind last year.",
    last_12m: "Direct bookings are behind the prior year.",
    custom: "Direct bookings softened in this period.",
  },
};

export function headlineStatus(
  metrics: ComparedMetrics,
  range: DateRange,
): string {
  if (metrics.current.bookings === 0) return "No direct bookings in this period.";

  const revenue = metrics.revenue.ratio;
  if (revenue === null) return "Here's how your direct bookings are doing.";

  const tier: Tier =
    revenue >= 0.2
      ? "strong"
      : revenue >= 0.08
        ? "growing"
        : revenue <= -0.08
          ? "softening"
          : "steady";

  return STATUS[tier][range.key] ?? STATUS[tier].custom;
}

/** Time of day at the property, not on the server. */
export function greeting(timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
