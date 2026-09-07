import type {
  AutumnNarrative,
  CampaignBreakdown,
  ComparedMetrics,
  Insight,
  MarketBreakdown,
} from "@/types/analytics";
import { CAMPAIGN_COPY } from "@/lib/content/campaign-copy";
import { compactCurrency, currency, percent } from "./format";

/**
 * Autumn's take.
 *
 * The owner should not have to hold "Brand Protection 41%", "Chicago +51%" and
 * "revenue +21%" in their head and work out the relationship. This layer does
 * that once, from the same queried numbers the rest of the screen renders, and
 * says the conclusion in a sentence.
 *
 * It is deterministic and template-based. There is no model behind it and the
 * UI never claims there is. It also refuses to assert cause: it will say a
 * market accounted for growth, never that a campaign caused it.
 */

const THRESHOLDS = {
  visitsSurge: 0.15,
  conversionDrop: -0.1,
  revenueDrop: -0.1,
  revenueGrowth: 0.08,
  marketGrowth: 0.2,
  /** A declining market is only worth mentioning if it is a real slice. */
  materialMarketShare: 0.05,
  marketDecline: -0.25,
  strategyShare: 0.3,
};

const MIN_BOOKINGS = 5;

/** "51% higher" / "24% lower" — a signed number nobody has to decode. */
function changeInWords(ratio: number | null | undefined): string {
  if (ratio == null || !Number.isFinite(ratio)) return "not comparable";
  return `${percent(Math.abs(ratio))} ${ratio >= 0 ? "higher" : "lower"}`;
}

/** The strategy producing the most booking revenue, if it produced any. */
export function leadingStrategy(
  campaigns: CampaignBreakdown[],
): CampaignBreakdown | null {
  const earning = campaigns.filter((c) => c.booking_revenue > 0);
  return earning.length > 0 ? earning[0] : null;
}

/** The market producing the most booking revenue. */
export function leadingMarket(markets: MarketBreakdown[]): MarketBreakdown | null {
  return markets.length > 0 ? markets[0] : null;
}

/** The market that added the most revenue against last year. */
export function fastestGrowingMarket(
  markets: MarketBreakdown[],
): MarketBreakdown | null {
  return (
    [...markets]
      .filter(
        (m) =>
          m.bookings >= MIN_BOOKINGS &&
          m.revenueDelta?.ratio != null &&
          m.revenueDelta.ratio >= THRESHOLDS.marketGrowth,
      )
      .sort((a, b) => (b.revenueDelta?.absolute ?? 0) - (a.revenueDelta?.absolute ?? 0))[0] ??
    null
  );
}

/**
 * A decline only counts when the market is large enough to matter. A market
 * holding 1% of revenue halving is noise, and reporting it as news would make
 * the product feel anxious rather than observant.
 */
export function materialDecliningMarket(
  markets: MarketBreakdown[],
): MarketBreakdown | null {
  return (
    [...markets]
      .filter(
        (m) =>
          m.revenueShare >= THRESHOLDS.materialMarketShare &&
          m.revenueDelta?.ratio != null &&
          m.revenueDelta.ratio <= THRESHOLDS.marketDecline &&
          m.revenueDelta.previous > 0,
      )
      .sort((a, b) => (a.revenueDelta?.absolute ?? 0) - (b.revenueDelta?.absolute ?? 0))[0] ??
    null
  );
}

/**
 * The one supporting observation worth showing beside the take — skipping any
 * insight that names something the take already covered, so the two never say
 * the same thing twice.
 */
export function secondaryInsight(
  narrative: AutumnNarrative | null,
  insights: Insight[],
): Insight | null {
  if (!narrative) return insights[0] ?? null;

  const covers = (insight: Insight) =>
    narrative.evidence.some((evidence) => {
      if (evidence.type !== insight.topic) return false;
      // Same subject: an untargeted topic (conversion, revenue) always
      // collides; a targeted one only collides on the same entity.
      return !evidence.id || insight.id.includes(evidence.id);
    });

  return insights.find((insight) => !covers(insight)) ?? null;
}

export function generateAutumnTake(input: {
  propertyName: string;
  metrics: ComparedMetrics;
  campaigns: CampaignBreakdown[];
  markets: MarketBreakdown[];
}): AutumnNarrative | null {
  const { propertyName, metrics, campaigns, markets } = input;
  const { current, previous } = metrics;

  if (current.bookings === 0 && current.impressions === 0) return null;

  const strategy = leadingStrategy(campaigns);
  const growing = fastestGrowingMarket(markets);
  const top = leadingMarket(markets);

  /* 1. A concern that materially affects the business comes first. */

  const visitsUp = metrics.websiteVisits.ratio;
  const rateChange = metrics.bookingRate.ratio;
  if (
    visitsUp != null &&
    rateChange != null &&
    visitsUp >= THRESHOLDS.visitsSurge &&
    rateChange <= THRESHOLDS.conversionDrop
  ) {
    return {
      headline: "More travelers are arriving, but fewer are booking.",
      body:
        `Visits to your website are ${changeInWords(visitsUp)} than the same period last year, while the share ` +
        `of visitors who booked moved from ${percent(previous.bookingRate)} to ${percent(current.bookingRate)}. ` +
        (strategy
          ? `${CAMPAIGN_COPY[strategy.campaign_type].subject} still produced ${percent(strategy.revenueShare)} of your direct booking revenue.`
          : ""),
      tone: "watch",
      evidence: [
        {
          type: "conversion",
          currentValue: current.bookingRate ?? 0,
          comparisonValue: previous.bookingRate ?? 0,
        },
      ],
    };
  }

  const revenueChange = metrics.revenue.ratio;
  if (revenueChange != null && revenueChange <= THRESHOLDS.revenueDrop) {
    const falling = materialDecliningMarket(markets);
    return {
      headline: "Direct booking revenue is behind last year.",
      body:
        `${currency(current.bookingRevenue)} against ${currency(previous.bookingRevenue)} in the same period last year. ` +
        (falling
          ? `${falling.guest_city} accounts for the largest part of it, with booking revenue ${changeInWords(falling.revenueDelta?.ratio)} than last year.`
          : `The decline is spread across markets rather than concentrated in one.`),
      tone: "watch",
      evidence: [
        {
          type: "revenue",
          currentValue: current.bookingRevenue,
          comparisonValue: previous.bookingRevenue,
        },
      ],
    };
  }

  /* 2. What drove the result, when the result is good. */

  if (strategy && strategy.revenueShare >= THRESHOLDS.strategyShare) {
    const copy = CAMPAIGN_COPY[strategy.campaign_type];
    const growthClause = growing
      ? ` ${growing.guest_city} was your strongest guest market, with booking revenue ${changeInWords(growing.revenueDelta?.ratio)} than the same period last year.`
      : top
        ? ` ${top.guest_city} remained your largest guest market at ${percent(top.revenueShare)} of booking revenue.`
        : "";

    return {
      headline: `${copy.subject} brought in the most booking revenue.`,
      body:
        `They produced ${percent(strategy.revenueShare)} of your direct booking revenue, ` +
        `${compactCurrency(strategy.booking_revenue)} in total.${growthClause}`,
      tone: "positive",
      evidence: [
        {
          type: "campaign",
          id: strategy.campaign_id,
          currentValue: strategy.booking_revenue,
        },
        ...(growing
          ? [
              {
                type: "market" as const,
                id: growing.guest_city,
                currentValue: growing.booking_revenue,
                comparisonValue: growing.revenueDelta?.previous,
              },
            ]
          : []),
      ],
    };
  }

  if (growing) {
    return {
      headline: `${growing.guest_city} accounted for most of your growth.`,
      body:
        `Travelers from ${growing.guest_city} booked ${compactCurrency(growing.booking_revenue)}, ` +
        `${changeInWords(growing.revenueDelta?.ratio)} than the same period last year, and now make up ` +
        `${percent(growing.revenueShare)} of direct booking revenue at ${propertyName}.`,
      tone: "positive",
      evidence: [
        {
          type: "market",
          id: growing.guest_city,
          currentValue: growing.booking_revenue,
          comparisonValue: growing.revenueDelta?.previous,
        },
      ],
    };
  }

  /* 3. Steady. Say so plainly rather than inventing a trend. */

  return {
    headline: "Direct booking performance is holding steady.",
    body:
      (revenueChange == null
        ? `${currency(current.bookingRevenue)} in direct booking revenue so far, with no comparable period last year yet. `
        : `Booking revenue is within ${percent(Math.abs(revenueChange), true)} of the same period last year. `) +
      (strategy
        ? `${CAMPAIGN_COPY[strategy.campaign_type].subject} continue to bring in the largest share, at ${percent(strategy.revenueShare)}.`
        : ""),
    tone: "neutral",
    evidence: [
      {
        type: "revenue",
        currentValue: current.bookingRevenue,
        comparisonValue: previous.bookingRevenue,
      },
    ],
  };
}
