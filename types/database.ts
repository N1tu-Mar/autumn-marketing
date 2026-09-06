/** Row shapes for the tables in supabase/migrations. */

export type CampaignType =
  | "brand_protection"
  | "discovery"
  | "metasearch"
  | "retargeting";

export type Property = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  timezone: string;
  room_count: number | null;
};

export type Campaign = {
  id: string;
  property_id: string;
  name: string;
  campaign_type: CampaignType;
  status: "active" | "paused" | "ended";
  started_at: string;
  ended_at: string | null;
};

export type AutumnAction = {
  id: string;
  property_id: string;
  campaign_id: string | null;
  action_date: string;
  action_type: string;
  title: string;
  description: string;
  status: "active" | "completed" | "monitoring";
};

/* ---- Return shapes of the aggregation functions in 0002_analytics_functions */

export type OverviewMetricsRow = {
  impressions: number;
  clicks: number;
  website_visits: number;
  ad_spend: number;
  bookings: number;
  booking_revenue: number;
  room_nights: number;
};

export type TrendRow = {
  bucket_start: string;
  booking_revenue: number;
  bookings: number;
};

export type CampaignPerformanceRow = {
  campaign_id: string;
  campaign_name: string;
  campaign_type: CampaignType;
  status: Campaign["status"];
  impressions: number;
  clicks: number;
  website_visits: number;
  ad_spend: number;
  bookings: number;
  booking_revenue: number;
};

export type FeederMarketRow = {
  guest_city: string;
  guest_region: string | null;
  bookings: number;
  booking_revenue: number;
  room_nights: number;
};
