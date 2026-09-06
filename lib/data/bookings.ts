import "server-only";
import { compareMetrics, toCampaignBreakdown, toMarketBreakdown } from "@/lib/analytics/metrics";
import { resolveRange } from "@/lib/analytics/range";
import { getDataThrough, getProperty } from "./property";
import { fetchCampaigns, fetchMarkets, fetchOverview } from "./queries";
import type { BookingsData } from "@/types/analytics";
import type { RangeParams } from "./overview";

/**
 * The booking detail screen. It reuses the same range resolution and the same
 * metric definitions as the main dashboard, so the two screens can never
 * disagree about how many bookings there were.
 */
export async function getBookingsData(params: RangeParams): Promise<BookingsData> {
  const property = await getProperty();
  const dataThrough = await getDataThrough(property.id);
  const range = resolveRange(params, dataThrough);

  const [currentTotals, priorTotals, campaignRows, marketRows, priorMarketRows] =
    await Promise.all([
      fetchOverview(property, range),
      fetchOverview(property, range.comparison),
      fetchCampaigns(property, range),
      fetchMarkets(property, range),
      fetchMarkets(property, range.comparison),
    ]);

  return {
    property,
    range,
    dataThrough,
    metrics: compareMetrics(currentTotals, priorTotals),
    campaigns: toCampaignBreakdown(campaignRows),
    markets: toMarketBreakdown(marketRows, priorMarketRows),
  };
}
