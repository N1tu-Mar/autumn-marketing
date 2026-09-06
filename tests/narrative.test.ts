import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareMetrics, toCampaignBreakdown, toMarketBreakdown } from "@/lib/analytics/metrics";
import { generateInsights } from "@/lib/analytics/insights";
import {
  generateAutumnTake,
  materialDecliningMarket,
  secondaryInsight,
} from "@/lib/analytics/narrative";
import type { CampaignPerformanceRow, FeederMarketRow, OverviewMetricsRow } from "@/types/database";

/**
 * The narrative layer is the only place in the product that puts words around
 * numbers, so it is the only place that can say something untrue. These cover
 * the four ways it could: naming the wrong entity, inventing a cause, dividing
 * by a zero prior period, and dramatising a flat period.
 */

const totals = (over: Partial<OverviewMetricsRow> = {}): OverviewMetricsRow => ({
  impressions: 100_000,
  clicks: 4_000,
  website_visits: 3_500,
  ad_spend: 10_000,
  bookings: 140,
  booking_revenue: 120_000,
  room_nights: 340,
  ...over,
});

const campaign = (
  name: string,
  revenue: number,
  over: Partial<CampaignPerformanceRow> = {},
): CampaignPerformanceRow => ({
  campaign_id: name.toLowerCase().replace(/\W+/g, "-"),
  campaign_name: name,
  campaign_type: "brand_protection",
  status: "active",
  impressions: 10_000,
  clicks: 900,
  website_visits: 800,
  ad_spend: 1_500,
  bookings: 40,
  booking_revenue: revenue,
  ...over,
});

const market = (city: string, revenue: number, bookings = 20): FeederMarketRow => ({
  guest_city: city,
  guest_region: "Illinois",
  bookings,
  booking_revenue: revenue,
  room_nights: bookings * 2,
});

function take(args: {
  current: OverviewMetricsRow;
  prior: OverviewMetricsRow;
  campaigns?: CampaignPerformanceRow[];
  markets?: FeederMarketRow[];
  priorMarkets?: FeederMarketRow[];
}) {
  return generateAutumnTake({
    propertyName: "Hotel Nichols",
    metrics: compareMetrics(args.current, args.prior),
    campaigns: toCampaignBreakdown(args.campaigns ?? []),
    markets: toMarketBreakdown(args.markets ?? [], args.priorMarkets ?? []),
  });
}

describe("Autumn's take", () => {
  it("names the market that actually grew, not the largest one", () => {
    const result = take({
      current: totals(),
      prior: totals({ booking_revenue: 100_000, bookings: 120 }),
      // Detroit is bigger; Chicago is the one that grew.
      markets: [market("Detroit", 60_000, 60), market("Chicago", 40_000, 40)],
      priorMarkets: [market("Detroit", 58_000, 58), market("Chicago", 20_000, 20)],
    });

    assert.ok(result);
    assert.match(result.headline, /Chicago/);
    assert.doesNotMatch(result.headline, /Detroit/);
    assert.equal(result.tone, "positive");
    assert.equal(result.evidence[0].id, "Chicago");
  });

  it("reports the derived percentage, not a rounded invention", () => {
    const result = take({
      current: totals(),
      prior: totals({ booking_revenue: 100_000 }),
      markets: [market("Chicago", 40_000, 40)],
      priorMarkets: [market("Chicago", 20_000, 20)],
    });

    // 40,000 from 20,000 is exactly +100%.
    assert.ok(result);
    assert.match(result.body, /\+100%/);
  });

  it("flags rising traffic with falling conversion, without claiming a cause", () => {
    const result = take({
      current: totals({ website_visits: 5_000, bookings: 140 }),
      prior: totals({ website_visits: 3_500, bookings: 140 }),
    });

    assert.ok(result);
    assert.equal(result.tone, "watch");
    assert.match(result.headline, /fewer are booking/);
    // No causal verbs: the data cannot support them.
    assert.doesNotMatch(result.body, /caused|because|due to|driving visitors/i);
  });

  it("does not produce a percentage when the prior period was zero", () => {
    const result = take({
      current: totals(),
      prior: totals({ booking_revenue: 0, bookings: 0, website_visits: 0, impressions: 0 }),
      markets: [market("Chicago", 40_000, 40)],
      priorMarkets: [],
    });

    assert.ok(result);
    assert.doesNotMatch(result.body, /Infinity|NaN|undefined/);
    assert.doesNotMatch(result.headline, /Infinity|NaN/);
  });

  it("stays calm when nothing crossed a threshold", () => {
    const result = take({
      current: totals(),
      prior: totals({ booking_revenue: 119_000, bookings: 139 }),
      markets: [market("Chicago", 40_000, 40)],
      priorMarkets: [market("Chicago", 39_500, 39)],
    });

    assert.ok(result);
    assert.equal(result.tone, "neutral");
    assert.match(result.headline, /steady/i);
    assert.doesNotMatch(result.body, /surge|plunge|collapse|soar/i);
  });

  it("leads with the dominant strategy when one carries the period", () => {
    const result = take({
      current: totals(),
      prior: totals({ booking_revenue: 110_000 }),
      campaigns: [
        campaign("Brand Protection", 60_000),
        campaign("Metasearch", 30_000, { campaign_type: "metasearch" }),
        campaign("Retargeting", 30_000, { campaign_type: "retargeting" }),
      ],
    });

    assert.ok(result);
    assert.match(result.headline, /Brand demand/);
    assert.equal(result.evidence[0].type, "campaign");
  });
});

describe("declining markets", () => {
  it("ignores a collapse in a market too small to matter", () => {
    const markets = toMarketBreakdown(
      [market("Chicago", 99_000, 99), market("Toledo", 1_000, 1)],
      [market("Chicago", 90_000, 90), market("Toledo", 9_000, 9)],
    );

    // Toledo fell 89%, but it is under 5% of revenue.
    assert.equal(materialDecliningMarket(markets), null);
  });

  it("surfaces a decline in a market that is a real slice of revenue", () => {
    const markets = toMarketBreakdown(
      [market("Chicago", 70_000, 70), market("Indianapolis", 20_000, 20)],
      [market("Chicago", 65_000, 65), market("Indianapolis", 40_000, 40)],
    );

    assert.equal(materialDecliningMarket(markets)?.guest_city, "Indianapolis");
  });
});

describe("take and supporting observation", () => {
  it("does not repeat the take's subject in the secondary observation", () => {
    const current = totals({ website_visits: 5_000 });
    const prior = totals({ website_visits: 3_500 });
    const metrics = compareMetrics(current, prior);
    const narrative = generateAutumnTake({
      propertyName: "Hotel Nichols",
      metrics,
      campaigns: [],
      markets: [],
    });

    const insights = generateInsights({
      metrics,
      campaigns: [],
      markets: [],
      range: {
        key: "last_90", from: "2026-06-08", to: "2026-09-05", label: "Last 90 days",
        days: 90, grain: "week",
        comparison: { from: "2025-06-08", to: "2025-09-05", label: "same period last year" },
      },
    });

    // Both layers detect the conversion dip; only one of them may say it.
    assert.equal(narrative?.evidence[0].type, "conversion");
    assert.ok(insights.some((i) => i.topic === "conversion"));
    assert.equal(secondaryInsight(narrative, insights)?.topic ?? null, null);
  });
});
