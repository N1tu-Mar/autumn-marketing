/**
 * The generative model behind the demo dataset.
 *
 * This file is the ONLY place that knows what a plausible independent hotel's
 * marketing program looks like. It is used by the seed script to write facts
 * into Postgres. The application never imports it — the app reads the database.
 *
 * Flow, per campaign per day:
 *   impressions -> clicks -> website visits -> bookings -> booking value
 * so the guest journey shown in the UI reconciles against the booking rows.
 */

export const PROPERTY = {
  slug: "harborlight-inn",
  name: "Harborlight Inn",
  city: "South Haven",
  state: "Michigan",
  country: "United States",
  timezone: "America/Detroit",
  room_count: 42,
} as const;

/** Inclusive date window for generated data (797 days). */
export const SEED_START = "2024-07-01";
export const SEED_END = "2026-09-05";

export type CampaignType =
  | "brand_protection"
  | "discovery"
  | "metasearch"
  | "retargeting";

export type CampaignSpec = {
  key: string;
  name: string;
  campaign_type: CampaignType;
  status: "active" | "paused" | "ended";
  started_at: string;
  ended_at: string | null;
  /** Impressions on a neutral day (seasonality 1.0, weekday 1.0, 2025 baseline). */
  baseImpressions: number;
  /** Share of impressions that become ad clicks. */
  ctr: number;
  /** Share of clicks that land as a measurable website visit. */
  clickToVisit: number;
  /** Share of website visits that become an attributed direct booking. */
  bookingConversion: number;
  /** Cost per click, before seasonal auction pressure. */
  cpc: number;
  /** Rate premium of guests arriving through this campaign. */
  adrFactor: number;
  /** How strongly this campaign skews toward the top feeder market. */
  chicagoTilt: number;
};

export const CAMPAIGNS: CampaignSpec[] = [
  {
    key: "brand",
    name: "Brand Protection",
    campaign_type: "brand_protection",
    status: "active",
    started_at: "2024-03-01",
    ended_at: null,
    baseImpressions: 78,
    ctr: 0.148,
    clickToVisit: 0.93,
    bookingConversion: 0.098,
    cpc: 1.35,
    adrFactor: 1.03,
    chicagoTilt: 0.98,
  },
  {
    key: "discovery",
    name: "Discovery & Competitors",
    campaign_type: "discovery",
    status: "active",
    started_at: "2024-05-15",
    ended_at: null,
    baseImpressions: 1180,
    ctr: 0.034,
    clickToVisit: 0.79,
    bookingConversion: 0.0135,
    cpc: 2.4,
    adrFactor: 0.98,
    chicagoTilt: 1.06,
  },
  {
    key: "metasearch",
    name: "Metasearch",
    campaign_type: "metasearch",
    status: "active",
    started_at: "2024-06-01",
    ended_at: null,
    baseImpressions: 245,
    ctr: 0.058,
    clickToVisit: 0.9,
    bookingConversion: 0.052,
    cpc: 2.05,
    adrFactor: 1.07,
    chicagoTilt: 1.12,
  },
  {
    key: "retargeting",
    name: "Retargeting",
    campaign_type: "retargeting",
    status: "active",
    started_at: "2024-09-10",
    ended_at: null,
    baseImpressions: 195,
    ctr: 0.045,
    clickToVisit: 0.88,
    bookingConversion: 0.042,
    cpc: 1.1,
    adrFactor: 0.99,
    chicagoTilt: 1.0,
  },
  {
    // A finished seasonal push. Proves the dashboard handles campaigns that
    // only have data inside part of the selected range.
    key: "winter",
    name: "Winter Getaways",
    campaign_type: "discovery",
    status: "ended",
    started_at: "2024-11-01",
    ended_at: "2025-03-31",
    baseImpressions: 330,
    ctr: 0.028,
    clickToVisit: 0.8,
    bookingConversion: 0.016,
    cpc: 1.6,
    adrFactor: 0.9,
    chicagoTilt: 0.92,
  },
];

/** Lake Michigan beach town: summer peak, dead February. Index 0 = January. */
export const MONTH_DEMAND = [
  0.34, 0.36, 0.5, 0.72, 1.02, 1.46, 1.78, 1.7, 1.16, 0.8, 0.5, 0.46,
];

/** Index 0 = Sunday. Weekend-led leisure demand. */
export const WEEKDAY_DEMAND = [1.0, 0.78, 0.74, 0.8, 0.9, 1.34, 1.46];

/** Average daily rate before weekend, campaign and noise adjustments. */
export const MONTH_ADR = [
  168, 172, 182, 206, 246, 296, 336, 330, 266, 224, 176, 192,
];

export const MARKETS = [
  { city: "Chicago", region: "Illinois", weight: 0.3, growth2026: 1.42 },
  { city: "Detroit", region: "Michigan", weight: 0.135, growth2026: 1.03 },
  { city: "Grand Rapids", region: "Michigan", weight: 0.105, growth2026: 1.06 },
  { city: "Indianapolis", region: "Indiana", weight: 0.085, growth2026: 0.94 },
  { city: "Milwaukee", region: "Wisconsin", weight: 0.07, growth2026: 1.11 },
  { city: "Naperville", region: "Illinois", weight: 0.055, growth2026: 1.2 },
  { city: "Kalamazoo", region: "Michigan", weight: 0.05, growth2026: 0.98 },
  { city: "Ann Arbor", region: "Michigan", weight: 0.045, growth2026: 1.05 },
  { city: "South Bend", region: "Indiana", weight: 0.04, growth2026: 0.97 },
  { city: "Columbus", region: "Ohio", weight: 0.033, growth2026: 1.0 },
  { city: "Cleveland", region: "Ohio", weight: 0.028, growth2026: 0.92 },
  { city: "Minneapolis", region: "Minnesota", weight: 0.023, growth2026: 1.08 },
  { city: "St. Louis", region: "Missouri", weight: 0.018, growth2026: 0.95 },
  { city: "Toledo", region: "Ohio", weight: 0.013, growth2026: 1.0 },
];

export const DEVICES: Array<{ device: string; weight: number }> = [
  { device: "mobile", weight: 0.58 },
  { device: "desktop", weight: 0.33 },
  { device: "tablet", weight: 0.09 },
];

/**
 * Spring/summer 2026: the discovery budget was widened into new metros.
 * Visits climb faster than bookings, so the booking rate dips even while
 * revenue grows. This is what makes the "traffic up, conversion down"
 * insight fire on real data rather than on a hand-written string.
 */
export const DISCOVERY_EXPANSION = {
  from: "2026-04-10",
  to: "2026-07-25",
  impressionMultiplier: 1.62,
  conversionMultiplier: 0.68,
};

/** A genuinely weaker stretch, so not every metric improves forever. */
export const SOFT_PATCH = { from: "2025-10-05", to: "2025-11-30", multiplier: 0.88 };

/** Year-over-year program strength, keyed by calendar year. */
export const YEAR_STRENGTH: Record<number, number> = {
  2024: 0.93,
  2025: 1.0,
  2026: 1.12,
};

/** Room-nights distribution for a stay, by [1,2,3,4,5] nights. */
export const NIGHT_WEIGHTS = [0.2, 0.4, 0.22, 0.11, 0.07];
export const PEAK_NIGHT_WEIGHTS = [0.09, 0.32, 0.28, 0.18, 0.13];
