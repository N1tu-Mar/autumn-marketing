/**
 * The generative model behind the demo dataset.
 *
 * The property is real: Historic Hotel Nichols, 201 Center Street, South Haven,
 * Michigan — 17 rooms and 2 suites, established 1884, independently owned and
 * family-operated for more than a century. Its size, location, seasonality and
 * public price anchors are documented in MODEL_ASSUMPTIONS.md.
 *
 * Everything else here is SYNTHETIC. The hotel's real occupancy, ADR, revenue,
 * bookings, channel mix, guest origins and advertising are not public and are
 * not claimed. This file models a plausible marketing program around a real
 * property using published hospitality benchmarks.
 *
 * This file is the ONLY place that knows what that program looks like. The seed
 * script uses it to write facts into Postgres. The application never imports it
 * — the app reads the database.
 *
 * Generation order is economics before marketing:
 *   rooms -> available room nights -> seasonal demand -> occupancy -> ADR
 *     -> sold room nights -> stays -> direct share -> attributed bookings
 *     -> website visits -> ad clicks -> ad impressions -> ad spend
 */

export const PROPERTY = {
  slug: "historic-hotel-nichols",
  name: "Historic Hotel Nichols",
  city: "South Haven",
  state: "Michigan",
  country: "United States",
  timezone: "America/Detroit",
  /** VERIFIED: 17 rooms + 2 suites. Wikipedia and the hotel's own room list agree. */
  room_count: 19,
  image_url: null,
  short_name: "Hotel Nichols",
} as const;

/** Hard physical ceiling. No night may sell more rooms than this. */
export const ROOM_COUNT = PROPERTY.room_count;

/** Inclusive date window for generated data (766 days). */
export const SEED_START = "2024-08-01";
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
  /** Impressions on a neutral day (demand 1.0, weekday 1.0, 2025 baseline). */
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
  /** How strongly this campaign reaches beyond Michigan. */
  outStateTilt: number;
};

/*
 * Campaign parameters. Every value sits inside a published benchmark band —
 * see MODEL_ASSUMPTIONS.md §9 for the source behind each one.
 *
 *   brand CTR 8-10%+        non-brand CTR 2-5%
 *   Google Hotel Ads CVR 3.55%   retargeting CTR 0.7-1.2%
 *   boutique hotel CPC $1.50-$3.00
 */
export const CAMPAIGNS: CampaignSpec[] = [
  {
    key: "brand",
    name: "Brand Protection",
    campaign_type: "brand_protection",
    status: "active",
    started_at: "2024-03-01",
    ended_at: null,
    // Deliberately small. A 19-key hotel generates limited branded query
    // volume, and inflating it would be the clearest tell of a fake dataset.
    baseImpressions: 28,
    ctr: 0.135,
    clickToVisit: 0.93,
    bookingConversion: 0.075,
    cpc: 1.2,
    adrFactor: 1.04,
    outStateTilt: 0.9,
  },
  {
    key: "discovery",
    name: "Discovery & Competitors",
    campaign_type: "discovery",
    status: "active",
    started_at: "2024-05-15",
    ended_at: null,
    baseImpressions: 415,
    ctr: 0.035,
    clickToVisit: 0.78,
    bookingConversion: 0.012,
    cpc: 2.6,
    adrFactor: 0.97,
    outStateTilt: 1.18,
  },
  {
    key: "metasearch",
    name: "Metasearch",
    campaign_type: "metasearch",
    status: "active",
    started_at: "2024-06-01",
    ended_at: null,
    baseImpressions: 127,
    ctr: 0.055,
    clickToVisit: 0.9,
    // Pinned to the published Google Hotel Ads conversion benchmark.
    bookingConversion: 0.036,
    cpc: 1.9,
    // Metasearch guests arrive on a chosen date at a rate already in view, so
    // they convert on higher-value in-season nights.
    adrFactor: 1.08,
    outStateTilt: 1.12,
  },
  {
    key: "retargeting",
    name: "Retargeting",
    campaign_type: "retargeting",
    status: "active",
    started_at: "2024-09-10",
    ended_at: null,
    // High impressions, near-zero CTR, cheap clicks: the shape of a display
    // remarketing pool built from roughly a thousand monthly site visitors.
    baseImpressions: 600,
    ctr: 0.01,
    clickToVisit: 0.86,
    bookingConversion: 0.03,
    cpc: 0.85,
    adrFactor: 1.0,
    outStateTilt: 1.02,
  },
  {
    // A finished seasonal push aimed at the Ice Breaker Festival weekend at
    // discounted winter rates. It ends, so the dashboard has to handle a
    // campaign with data in only part of the selected range.
    key: "winter",
    name: "Winter Getaways",
    campaign_type: "discovery",
    status: "ended",
    started_at: "2024-11-01",
    ended_at: "2025-03-31",
    baseImpressions: 240,
    ctr: 0.027,
    clickToVisit: 0.8,
    bookingConversion: 0.014,
    cpc: 1.55,
    adrFactor: 0.88,
    outStateTilt: 0.95,
  },
];

/**
 * Occupancy, not an abstract index: the share of the 19 rooms sold on a neutral
 * day of that month. Shaped on the published west-Michigan lakeshore curve
 * (July 81%, August 72%, March 30%) and lifted slightly because hotel stays are
 * shorter than rentals. February sits above March because the Ice Breaker
 * Festival lands in its first weekend and March has no anchor event.
 *
 * Annual mean 0.507 — below the US 62-64% benchmark, which is correct. A
 * Michigan beach town cannot hold national-average occupancy through winter.
 *
 * Index 0 = January.
 */
export const MONTH_OCCUPANCY = [
  0.28, 0.32, 0.3, 0.4, 0.55, 0.75, 0.86, 0.84, 0.62, 0.5, 0.32, 0.34,
];

/**
 * Modeled achieved rate before weekday, event, campaign and noise adjustments.
 *
 * MODELED, anchored on public price observations: metasearch aggregators show a
 * ~$222 average nightly price, a $145 floor, February and March as the cheapest
 * months, and a recent booked band of $157-$467. This curve is fitted so its
 * occupancy-weighted mean lands within a few percent of that public anchor. It
 * is an assumed achieved rate, not the hotel's actual ADR, which is not public.
 *
 * Index 0 = January.
 */
export const MONTH_ADR = [
  148, 145, 152, 172, 205, 262, 305, 312, 238, 198, 158, 168,
];

/** Weekend-led drive-market leisure demand. Index 0 = Sunday. Mean 1.0. */
export const WEEKDAY_DEMAND = [0.96, 0.74, 0.72, 0.78, 0.9, 1.38, 1.52];

/**
 * Rate by day of week. The one public weekday signal is that Monday is the
 * cheapest night (~$174 against a ~$222 average); the curve is built around
 * that and mirrored into a weekend premium. Index 0 = Sunday. Mean ~1.0.
 */
export const WEEKDAY_ADR = [0.94, 0.82, 0.8, 0.85, 0.93, 1.14, 1.2];

/**
 * Real, dated South Haven events. The dates are VERIFIED; the demand and rate
 * multipliers are MODELED. Occupancy is capped at 1.0 afterwards, so an event
 * lifts a slow weekend rather than overselling the building.
 */
export const EVENTS: Array<{
  name: string;
  from: string;
  to: string;
  demand: number;
  adr: number;
}> = [
  // National Blueberry Festival — second weekend of August, ~50,000 attendees.
  { name: "National Blueberry Festival", from: "2024-08-08", to: "2024-08-11", demand: 1.18, adr: 1.35 },
  { name: "National Blueberry Festival", from: "2025-08-07", to: "2025-08-10", demand: 1.18, adr: 1.35 },
  { name: "National Blueberry Festival", from: "2026-08-06", to: "2026-08-09", demand: 1.18, adr: 1.35 },
  // Harborfest — the first big on-the-water celebration of the year.
  { name: "Harborfest", from: "2025-06-20", to: "2025-06-21", demand: 1.15, adr: 1.18 },
  { name: "Harborfest", from: "2026-06-19", to: "2026-06-20", demand: 1.15, adr: 1.18 },
  // Ice Breaker Festival — first weekend of February, off the lowest base.
  { name: "Ice Breaker Festival", from: "2025-01-31", to: "2025-02-02", demand: 1.55, adr: 1.22 },
  { name: "Ice Breaker Festival", from: "2026-01-30", to: "2026-02-01", demand: 1.55, adr: 1.22 },
];

/**
 * Feeder markets.
 *
 * Visit South Haven's Placer.ai analysis reports roughly 52% of *destination
 * visitors* from Michigan and 18% from Illinois. Those are destination-level
 * priors covering day-trippers as well as overnight guests — they are NOT this
 * hotel's booking mix, which is not public. Overnight boutique-hotel guests
 * skew farther from home than day visitors, so Michigan is modeled as
 * dominant but less so than 52%, and Illinois somewhat above 18%.
 *
 * Every individual city weight is MODELED, ordered by drive time from South
 * Haven. Every growth factor is MODELED: South Haven's reported flat-to-soft
 * visitation is applied as a background demand constraint (DESTINATION_TREND),
 * not as evidence that any particular city declined.
 */
export const MARKETS = [
  // Michigan — collectively dominant (~0.44)
  { city: "Grand Rapids", region: "Michigan", weight: 0.1, growth2026: 1.14 },
  { city: "Detroit", region: "Michigan", weight: 0.095, growth2026: 1.1 },
  { city: "Kalamazoo", region: "Michigan", weight: 0.065, growth2026: 1.03 },
  { city: "Ann Arbor", region: "Michigan", weight: 0.045, growth2026: 1.06 },
  { city: "Holland", region: "Michigan", weight: 0.04, growth2026: 1.04 },
  { city: "Lansing", region: "Michigan", weight: 0.035, growth2026: 1.02 },
  { city: "Muskegon", region: "Michigan", weight: 0.03, growth2026: 1.01 },
  { city: "Battle Creek", region: "Michigan", weight: 0.03, growth2026: 0.99 },
  // Illinois (~0.22) — materially smaller than the drive-market stereotype
  // Chicago and Naperville are the MODELED declining feeder markets. The
  // factors are large enough to show an absolute year-over-year fall despite
  // the program's overall growth, which is the point of having them.
  { city: "Chicago", region: "Illinois", weight: 0.155, growth2026: 0.62 },
  { city: "Naperville", region: "Illinois", weight: 0.04, growth2026: 0.72 },
  { city: "Rockford", region: "Illinois", weight: 0.025, growth2026: 0.98 },
  // Indiana
  { city: "Indianapolis", region: "Indiana", weight: 0.05, growth2026: 1.28 },
  { city: "South Bend", region: "Indiana", weight: 0.04, growth2026: 1.03 },
  { city: "Fort Wayne", region: "Indiana", weight: 0.03, growth2026: 1.07 },
  // Ohio
  { city: "Columbus", region: "Ohio", weight: 0.03, growth2026: 1.21 },
  { city: "Cleveland", region: "Ohio", weight: 0.025, growth2026: 0.96 },
  { city: "Toledo", region: "Ohio", weight: 0.02, growth2026: 1.0 },
  // Wisconsin and beyond
  { city: "Milwaukee", region: "Wisconsin", weight: 0.038, growth2026: 1.08 },
  { city: "Madison", region: "Wisconsin", weight: 0.017, growth2026: 1.05 },
  { city: "Minneapolis", region: "Minnesota", weight: 0.025, growth2026: 1.06 },
  { city: "St. Louis", region: "Missouri", weight: 0.022, growth2026: 0.94 },
  { city: "Nashville", region: "Tennessee", weight: 0.012, growth2026: 1.16 },
  { city: "Cincinnati", region: "Ohio", weight: 0.031, growth2026: 1.02 },
];

/**
 * Mobile carries most hotel traffic; desktop converts roughly twice as well.
 * Visits and bookings therefore must not share a distribution — applying the
 * conversion index reproduces the published "mobile browses, desktop books"
 * split rather than asserting it.
 */
export const DEVICES: Array<{
  device: string;
  weight: number;
  conversionIndex: number;
}> = [
  { device: "mobile", weight: 0.62, conversionIndex: 1.0 },
  { device: "desktop", weight: 0.3, conversionIndex: 2.0 },
  { device: "tablet", weight: 0.08, conversionIndex: 1.2 },
];

/**
 * Spring/summer 2026: the discovery budget was widened into new metros.
 * Visits climb faster than bookings, so the booking rate dips even while
 * revenue grows. This is what makes the "traffic up, conversion down"
 * insight fire on real data rather than on a hand-written string.
 */
export const DISCOVERY_EXPANSION = {
  // Sized so the effect is unmistakable on the dashboard: non-brand visits
  // roughly double while their conversion falls by a third, which pulls the
  // blended booking rate down even though revenue keeps climbing.
  from: "2026-04-10",
  to: "2026-07-25",
  impressionMultiplier: 2.0,
  conversionMultiplier: 0.66,
};

/** A genuinely weaker stretch, so not every metric improves forever. */
export const SOFT_PATCH = { from: "2025-10-05", to: "2025-11-30", multiplier: 0.86 };

/**
 * A real reallocation with a visible before and after: budget moved out of
 * non-brand Discovery and into Metasearch from October 2025.
 */
export const BUDGET_SHIFT = {
  from: "2025-10-01",
  discoveryImpressionMultiplier: 0.75,
  metasearchImpressionMultiplier: 1.45,
};

/**
 * Competitors began bidding on the hotel's name after its National Register
 * listing, so defending the brand term costs more from spring 2025.
 */
export const BRAND_CPC_STEP = { from: "2025-04-01", cpcMultiplier: 1.13 };

/**
 * Background destination demand. South Haven's reported visitation is flat —
 * 2025 matched 2020 — while nearby towns grew. That is a constraint on the
 * hotel's demand, applied here and nowhere else.
 */
export const DESTINATION_TREND: Record<number, number> = {
  2024: 1.01,
  2025: 1.0,
  2026: 0.985,
};

/** How mature Autumn's program is. Affects marketing reach, not hotel demand. */
export const PROGRAM_STRENGTH: Record<number, number> = {
  2024: 0.9,
  2025: 1.0,
  2026: 1.13,
};

/**
 * Share of all stays booked directly rather than through an OTA. Published
 * research puts independents near 36.6% direct; a National Register property
 * with a strong local brand and its own booking engine is modeled above that
 * average. A deliberate, stated stretch.
 *
 * OTA stays consume room inventory but are never written to the bookings
 * table — that table holds direct bookings only, exactly as the dashboard
 * queries expect.
 */
export const DIRECT_BOOKING_SHARE = 0.45;

/** Room-nights distribution for a stay, by [1,2,3,4,5] nights. */
export const NIGHT_WEIGHTS = [0.3, 0.42, 0.17, 0.07, 0.04];
export const PEAK_NIGHT_WEIGHTS = [0.1, 0.4, 0.28, 0.14, 0.08];

/**
 * Booking lead time in days, by season. Global benchmarks put the average
 * booking window near 32 days and the 2026 window at 15-25; boutique properties
 * run 14-45. Summer weekends are booked far ahead, February midweek is not.
 */
export const LEAD_TIME = {
  peak: { min: 18, max: 88 },      // June-August arrivals
  shoulder: { min: 9, max: 46 },   // April-May, September-October
  winter: { min: 3, max: 28 },     // November-March
};

/** Peak-season auctions cost more; Q1 costs far less. */
export const SEASONAL_CPC = [
  0.68, 0.68, 0.68, 1.08, 1.08, 1.08, 1.55, 1.55, 1.55, 1.15, 1.15, 1.15,
];
