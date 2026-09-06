import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import type { DateRange } from "@/types/analytics";
import type {
  AutumnAction,
  CampaignPerformanceRow,
  FeederMarketRow,
  OverviewMetricsRow,
  Property,
  TrendRow,
} from "@/types/database";

/**
 * Thin wrappers over the aggregation functions in
 * supabase/migrations/0002_analytics_functions.sql.
 *
 * Aggregation happens in Postgres: it keeps both screens on one definition of
 * every metric, and it means a two-year range is one round trip rather than
 * thousands of rows crossing the wire.
 */

type Window = { from: string; to: string };

function fail(what: string, message: string): never {
  throw new Error(`Could not load ${what}: ${message}`);
}

export async function fetchOverview(
  property: Property,
  window: Window,
): Promise<OverviewMetricsRow> {
  const { data, error } = await getSupabase().rpc("overview_metrics", {
    p_property: property.id,
    p_from: window.from,
    p_to: window.to,
    p_tz: property.timezone,
  });
  if (error) fail("performance totals", error.message);
  const row = (data as OverviewMetricsRow[] | null)?.[0];
  return (
    row ?? {
      impressions: 0, clicks: 0, website_visits: 0, ad_spend: 0,
      bookings: 0, booking_revenue: 0, room_nights: 0,
    }
  );
}

export async function fetchTrend(
  property: Property,
  window: Window,
  grain: DateRange["grain"],
): Promise<TrendRow[]> {
  const { data, error } = await getSupabase().rpc("performance_trend", {
    p_property: property.id,
    p_from: window.from,
    p_to: window.to,
    p_grain: grain,
    p_tz: property.timezone,
  });
  if (error) fail("the booking trend", error.message);
  return (data as TrendRow[] | null) ?? [];
}

export async function fetchCampaigns(
  property: Property,
  window: Window,
): Promise<CampaignPerformanceRow[]> {
  const { data, error } = await getSupabase().rpc("campaign_performance", {
    p_property: property.id,
    p_from: window.from,
    p_to: window.to,
    p_tz: property.timezone,
  });
  if (error) fail("campaign performance", error.message);
  return (data as CampaignPerformanceRow[] | null) ?? [];
}

export async function fetchMarkets(
  property: Property,
  window: Window,
): Promise<FeederMarketRow[]> {
  const { data, error } = await getSupabase().rpc("feeder_markets", {
    p_property: property.id,
    p_from: window.from,
    p_to: window.to,
    p_tz: property.timezone,
  });
  if (error) fail("feeder markets", error.message);
  return (data as FeederMarketRow[] | null) ?? [];
}

/**
 * Actions Autumn has taken up to the end of the selected period. Bounded by
 * the range end so the section never describes work from the future.
 */
export async function fetchActions(
  property: Property,
  window: Window,
  limit = 3,
): Promise<AutumnAction[]> {
  const { data, error } = await getSupabase()
    .from("autumn_actions")
    .select(
      "id, property_id, campaign_id, action_date, action_type, title, description, status",
    )
    .eq("property_id", property.id)
    .lte("action_date", window.to)
    .order("action_date", { ascending: false })
    .limit(limit);
  if (error) fail("Autumn's recent activity", error.message);
  return (data as AutumnAction[] | null) ?? [];
}
