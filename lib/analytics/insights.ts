import type {
  CampaignBreakdown,
  ComparedMetrics,
  DateRange,
  Insight,
  MarketBreakdown,
} from "@/types/analytics";
import { currency, count, percent, signedPercent } from "./format";

/**
 * Rule-based insights.
 *
 * The sentence templates and thresholds live in code; every number, market
 * name and campaign name inside them comes from a query. There is no
 * generative model here, and the UI does not claim there is one.
 */

const THRESHOLDS = {
  revenueMove: 0.1,
  bookingsMove: 0.1,
  visitsSurge: 0.15,
  conversionDrop: -0.1,
  marketGrowth: 0.2,
  campaignShare: 0.4,
  steady: 0.03,
};

const MIN_BOOKINGS_FOR_MARKET_INSIGHT = 5;

export function generateInsights(input: {
  metrics: ComparedMetrics;
  campaigns: CampaignBreakdown[];
  markets: MarketBreakdown[];
  range: DateRange;
}): Insight[] {
  const { metrics, campaigns, markets } = input;
  const { current, previous } = metrics;
  const candidates: Insight[] = [];

  if (current.bookings === 0 && current.impressions === 0) return [];

  /* -- concerns first: the owner should never have to dig for bad news ----- */

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
      tone: "concern",
      title: "More travelers are visiting, but fewer are booking",
      detail:
        `Website visits from Autumn ads are ${signedPercent(visitsUp)} against the same period last year, ` +
        `while the share of visitors who book fell from ${percent(previous.bookingRate)} to ${percent(current.bookingRate)}.`,
    });
  }

  const revenueChange = metrics.revenue.ratio;
  if (revenueChange !== null && revenueChange <= -THRESHOLDS.revenueMove) {
    candidates.push({
      id: "revenue-down",
      tone: "concern",
      title: "Direct booking revenue is down from last year",
      detail:
        `${currency(current.bookingRevenue)} this period against ${currency(previous.bookingRevenue)} in the same period last year, ` +
        `a difference of ${currency(Math.abs(metrics.revenue.absolute))}.`,
    });
  }

  /* -- then the movements worth knowing about ----------------------------- */

  if (revenueChange !== null && revenueChange >= THRESHOLDS.revenueMove) {
    candidates.push({
      id: "revenue-up",
      tone: "positive",
      title: `Direct booking revenue is up ${signedPercent(revenueChange)}`,
      detail:
        `${currency(current.bookingRevenue)} in direct booking revenue, ` +
        `${currency(Math.abs(metrics.revenue.absolute))} more than the same period last year.`,
    });
  }

  const bookingsChange = metrics.bookings.ratio;
  if (bookingsChange !== null && bookingsChange >= THRESHOLDS.bookingsMove) {
    const extra = Math.round(metrics.bookings.absolute);
    candidates.push({
      id: "bookings-up",
      tone: "positive",
      title: `${count(extra)} more direct bookings than last year`,
      detail:
        `${count(current.bookings)} direct bookings this period against ` +
        `${count(previous.bookings)} in the same period last year.`,
    });
  }

  const topMarket = markets[0];
  const growingMarket = markets.find(
    (m) =>
      m.bookings >= MIN_BOOKINGS_FOR_MARKET_INSIGHT &&
      m.revenueDelta?.ratio !== null &&
      m.revenueDelta !== null &&
      m.revenueDelta.ratio! >= THRESHOLDS.marketGrowth,
  );
  if (growingMarket) {
    candidates.push({
      id: `market-growth-${growingMarket.guest_city}`,
      tone: "positive",
      title: `${growingMarket.guest_city} is your fastest-growing booking market`,
      detail:
        `${currency(growingMarket.booking_revenue)} from ${count(growingMarket.bookings)} bookings, ` +
        `${signedPercent(growingMarket.revenueDelta!.ratio)} against the same period last year.`,
    });
  } else if (topMarket && topMarket.revenueShare >= 0.2) {
    candidates.push({
      id: `market-top-${topMarket.guest_city}`,
      tone: "neutral",
      title: `${topMarket.guest_city} sends you the most booking revenue`,
      detail:
        `${currency(topMarket.booking_revenue)} — ${percent(topMarket.revenueShare)} of all direct booking revenue this period.`,
    });
  }

  const topCampaign = campaigns[0];
  if (topCampaign && topCampaign.revenueShare >= THRESHOLDS.campaignShare) {
    candidates.push({
      id: `campaign-${topCampaign.campaign_id}`,
      tone: "neutral",
      title: `${topCampaign.campaign_name} is driving the most booking revenue`,
      detail:
        `${currency(topCampaign.booking_revenue)} from ${count(topCampaign.bookings)} bookings — ` +
        `${percent(topCampaign.revenueShare)} of the total.`,
    });
  }

  /* -- and a calm answer when nothing has really moved -------------------- */

  if (candidates.length === 0) {
    candidates.push({
      id: "steady",
      tone: "neutral",
      title: "Performance is steady",
      detail:
        revenueChange === null
          ? `${currency(current.bookingRevenue)} in direct booking revenue this period. There is no comparable period last year yet.`
          : `Direct booking revenue is within ${percent(Math.abs(revenueChange), true)} of the same period last year.`,
    });
  }

  return candidates.slice(0, 3);
}

/**
 * The hero sentence. Same idea as the insights: a template chosen by data.
 */
export function headlineStatus(metrics: ComparedMetrics): string {
  const revenue = metrics.revenue.ratio;
  const visits = metrics.websiteVisits.ratio;
  const rate = metrics.bookingRate.ratio;

  if (metrics.current.bookings === 0) return "No direct bookings in this period";
  if (revenue === null) return "Your direct booking results so far";

  if (
    visits !== null &&
    rate !== null &&
    visits >= THRESHOLDS.visitsSurge &&
    rate <= THRESHOLDS.conversionDrop
  ) {
    return "Traffic is growing, but fewer visitors are booking";
  }
  if (revenue >= 0.25) return "You're having a strong season";
  if (revenue >= THRESHOLDS.revenueMove) return "Your direct bookings are growing";
  if (revenue <= -THRESHOLDS.revenueMove) return "Direct booking revenue is behind last year";
  return "Direct booking performance is steady";
}
