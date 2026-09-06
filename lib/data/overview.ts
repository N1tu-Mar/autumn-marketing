import "server-only";
import { generateInsights } from "@/lib/analytics/insights";
import {
  compareMetrics,
  toCampaignBreakdown,
  toMarketBreakdown,
} from "@/lib/analytics/metrics";
import { resolveRange } from "@/lib/analytics/range";
import { getDataThrough, getProperty } from "./property";
import {
  fetchActions,
  fetchCampaigns,
  fetchMarkets,
  fetchOverview,
  fetchTrend,
} from "./queries";
import type { DashboardData } from "@/types/analytics";

export type RangeParams = { range?: string; from?: string; to?: string };

/**
 * Everything the main dashboard renders, in one server-side call.
 * Independent queries run in parallel — the page waits on the slowest, not
 * on the sum.
 */
export async function getDashboardData(
  params: RangeParams,
): Promise<DashboardData> {
  const property = await getProperty();
  const dataThrough = await getDataThrough(property.id);
  const range = resolveRange(params, dataThrough);

  const [
    currentTotals,
    priorTotals,
    currentTrend,
    comparisonTrend,
    campaignRows,
    marketRows,
    priorMarketRows,
    actions,
  ] = await Promise.all([
    fetchOverview(property, range),
    fetchOverview(property, range.comparison),
    fetchTrend(property, range, range.grain),
    fetchTrend(property, range.comparison, range.grain),
    fetchCampaigns(property, range),
    fetchMarkets(property, range),
    fetchMarkets(property, range.comparison),
    fetchActions(property, range, 3),
  ]);

  const metrics = compareMetrics(currentTotals, priorTotals);

  return {
    property,
    range,
    dataThrough,
    metrics,
    trend: { current: currentTrend, comparison: comparisonTrend },
    insights: generateInsights({
      metrics,
      campaigns: toCampaignBreakdown(campaignRows),
      markets: toMarketBreakdown(marketRows, priorMarketRows),
      range,
    }),
    actions,
  };
}
