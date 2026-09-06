/**
 * Deterministic dataset generator.
 *
 * Given a fixed seed, this produces byte-identical rows every run, so
 * `npm run seed` is repeatable and reviewable. Nothing here runs at request
 * time — the output is written to Postgres and the app reads it back.
 */
import {
  CAMPAIGNS,
  DEVICES,
  DISCOVERY_EXPANSION,
  MARKETS,
  MONTH_ADR,
  MONTH_DEMAND,
  NIGHT_WEIGHTS,
  PEAK_NIGHT_WEIGHTS,
  PROPERTY,
  SEED_END,
  SEED_START,
  SOFT_PATCH,
  WEEKDAY_DEMAND,
  YEAR_STRENGTH,
  type CampaignSpec,
} from "./seed-model";

/* -------------------------------------------------------------- randomness */

/** mulberry32 — small, fast, fully deterministic. */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const between = (rng: Rng, lo: number, hi: number) => lo + rng() * (hi - lo);
/** Multiplicative jitter centred on 1. */
const jitter = (rng: Rng, spread: number) => 1 + (rng() * 2 - 1) * spread;

function pickWeighted<T extends { weight: number }>(rng: Rng, items: T[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function pickIndex(rng: Rng, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

/** RFC-4122-shaped v4 UUID drawn from the seeded stream, not crypto. */
function uuid(rng: Rng): string {
  const hex: string[] = [];
  for (let i = 0; i < 256; i++) hex.push((i + 0x100).toString(16).slice(1));
  const b = Array.from({ length: 16 }, () => Math.floor(rng() * 256));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return (
    hex[b[0]] + hex[b[1]] + hex[b[2]] + hex[b[3]] + "-" +
    hex[b[4]] + hex[b[5]] + "-" +
    hex[b[6]] + hex[b[7]] + "-" +
    hex[b[8]] + hex[b[9]] + "-" +
    hex[b[10]] + hex[b[11]] + hex[b[12]] + hex[b[13]] + hex[b[14]] + hex[b[15]]
  );
}

/* ------------------------------------------------------------------- dates */

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Iterate calendar days in UTC; dates carry no time component. */
function eachDay(from: string, to: string): Date[] {
  const out: Date[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    out.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}

function tzOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  return asUtc - instant.getTime();
}

/** Wall-clock time in a timezone -> the UTC instant it refers to. */
export function zonedWallToUtc(
  day: Date, hour: number, minute: number, timeZone: string,
): Date {
  const naive = Date.UTC(
    day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute, 0,
  );
  const firstGuess = naive - tzOffsetMs(new Date(naive), timeZone);
  return new Date(naive - tzOffsetMs(new Date(firstGuess), timeZone));
}

const inWindow = (day: Date, from: string, to: string) =>
  day >= new Date(`${from}T00:00:00Z`) && day <= new Date(`${to}T00:00:00Z`);

/* ------------------------------------------------------------ demand model */

function demandFor(day: Date, rng: Rng): number {
  const month = day.getUTCMonth();
  const year = day.getUTCFullYear();
  const season = MONTH_DEMAND[month];
  const weekday = WEEKDAY_DEMAND[day.getUTCDay()];
  const strength = YEAR_STRENGTH[year] ?? 1;
  const soft = inWindow(day, SOFT_PATCH.from, SOFT_PATCH.to)
    ? SOFT_PATCH.multiplier
    : 1;
  return season * weekday * strength * soft * jitter(rng, 0.16);
}

function campaignActiveOn(campaign: CampaignSpec, day: Date): boolean {
  if (day < new Date(`${campaign.started_at}T00:00:00Z`)) return false;
  if (campaign.ended_at && day > new Date(`${campaign.ended_at}T00:00:00Z`)) {
    return false;
  }
  return true;
}

export type GeneratedRows = {
  property: Record<string, unknown>;
  campaigns: Array<Record<string, unknown>>;
  metrics: Array<Record<string, unknown>>;
  bookings: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
};

export function generate(seed = 20260905): GeneratedRows {
  const rng = makeRng(seed);
  const tz = PROPERTY.timezone;

  const propertyId = uuid(rng);
  const property = { id: propertyId, ...PROPERTY };

  const campaignIds = new Map<string, string>();
  const campaigns = CAMPAIGNS.map((c) => {
    const id = uuid(rng);
    campaignIds.set(c.key, id);
    return {
      id,
      property_id: propertyId,
      name: c.name,
      campaign_type: c.campaign_type,
      status: c.status,
      started_at: c.started_at,
      ended_at: c.ended_at,
    };
  });

  const metrics: Array<Record<string, unknown>> = [];
  const bookings: Array<Record<string, unknown>> = [];
  const days = eachDay(SEED_START, SEED_END);

  for (const day of days) {
    const demand = demandFor(day, rng);
    const month = day.getUTCMonth();
    const year = day.getUTCFullYear();
    const isPeak = month >= 5 && month <= 7;
    const isWeekend = day.getUTCDay() === 5 || day.getUTCDay() === 6;

    for (const spec of CAMPAIGNS) {
      if (!campaignActiveOn(spec, day)) continue;
      const campaignId = campaignIds.get(spec.key)!;

      const expansion =
        spec.key === "discovery" &&
        inWindow(day, DISCOVERY_EXPANSION.from, DISCOVERY_EXPANSION.to);

      const impressions = Math.max(
        0,
        Math.round(
          spec.baseImpressions *
            demand *
            (expansion ? DISCOVERY_EXPANSION.impressionMultiplier : 1) *
            jitter(rng, 0.12),
        ),
      );
      const clicks = Math.min(
        impressions,
        Math.round(impressions * spec.ctr * jitter(rng, 0.14)),
      );
      const websiteVisits = Math.min(
        clicks,
        Math.round(clicks * spec.clickToVisit * jitter(rng, 0.05)),
      );
      // Auctions cost more when everyone wants the same summer weekend.
      const spend = clicks * spec.cpc * (0.85 + 0.3 * MONTH_DEMAND[month]) * jitter(rng, 0.1);

      metrics.push({
        property_id: propertyId,
        campaign_id: campaignId,
        metric_date: isoDate(day),
        impressions,
        clicks,
        website_visits: websiteVisits,
        ad_spend: Number(spend.toFixed(2)),
      });

      const conversion =
        spec.bookingConversion *
        (expansion ? DISCOVERY_EXPANSION.conversionMultiplier : 1) *
        (isPeak ? 1.08 : 1) *
        jitter(rng, 0.18);

      const expected = websiteVisits * conversion;
      const count = Math.floor(expected) + (rng() < expected % 1 ? 1 : 0);

      for (let i = 0; i < count; i++) {
        bookings.push(
          makeBooking(rng, {
            propertyId, campaignId, day, tz, spec, year, month, isPeak, isWeekend,
          }),
        );
      }
    }

    // Direct bookings Autumn cannot connect to a campaign. They exist so the
    // attribution filter in every query is doing real work.
    const organicExpected = 0.85 * demand;
    const organicCount =
      Math.floor(organicExpected) + (rng() < organicExpected % 1 ? 1 : 0);
    for (let i = 0; i < organicCount; i++) {
      bookings.push(
        makeBooking(rng, {
          propertyId, campaignId: null, day, tz,
          spec: CAMPAIGNS[0], year, month, isPeak, isWeekend,
          attributed: false,
        }),
      );
    }
  }

  const actions = makeActions(rng, propertyId, campaignIds);
  return { property, campaigns, metrics, bookings, actions };
}

/* ---------------------------------------------------------------- bookings */

function makeBooking(
  rng: Rng,
  ctx: {
    propertyId: string;
    campaignId: string | null;
    day: Date;
    tz: string;
    spec: CampaignSpec;
    year: number;
    month: number;
    isPeak: boolean;
    isWeekend: boolean;
    attributed?: boolean;
  },
): Record<string, unknown> {
  const { propertyId, campaignId, day, tz, spec, year, month, isPeak } = ctx;
  const attributed = ctx.attributed ?? true;

  const nights =
    pickIndex(rng, isPeak ? PEAK_NIGHT_WEIGHTS : NIGHT_WEIGHTS) + 1;

  // Lead time stretches in peak season: summer weekends get booked early.
  const leadDays = Math.round(
    isPeak ? between(rng, 24, 92) : month >= 3 && month <= 9
      ? between(rng, 11, 48)
      : between(rng, 4, 30),
  );
  let checkIn = addDays(day, leadDays);
  // Leisure arrivals cluster on Thursday-Saturday.
  if (rng() < 0.6) {
    const shift = (5 - checkIn.getUTCDay() + 7) % 7;
    checkIn = addDays(checkIn, shift);
  }
  const checkOut = addDays(checkIn, nights);

  const arrivalMonth = checkIn.getUTCMonth();
  const priceDrift = 1 + 0.035 * (year - 2024);
  const weekendRate = checkIn.getUTCDay() >= 5 || checkIn.getUTCDay() === 4 ? 1.18 : 1;
  const suite = rng() < 0.06 ? between(rng, 1.3, 1.55) : 1;
  const adr =
    MONTH_ADR[arrivalMonth] *
    priceDrift *
    weekendRate *
    spec.adrFactor *
    suite *
    jitter(rng, 0.1);
  const bookingValue = Math.max(95, Math.round(adr * nights * 100) / 100);

  const marketWeights = MARKETS.map((m) => ({
    ...m,
    weight:
      m.weight *
      (year >= 2026 ? m.growth2026 : 1) *
      (m.city === "Chicago" ? spec.chicagoTilt : 1),
  }));
  const market = pickWeighted(rng, marketWeights);
  const device = pickWeighted(rng, DEVICES);

  // Booking traffic peaks late morning and again after dinner.
  const hour = rng() < 0.45
    ? Math.floor(between(rng, 9, 14))
    : Math.floor(between(rng, 18, 23));
  const bookedAt = zonedWallToUtc(day, hour, Math.floor(rng() * 60), tz);

  return {
    id: uuid(rng),
    property_id: propertyId,
    campaign_id: campaignId,
    booked_at: bookedAt.toISOString(),
    check_in: isoDate(checkIn),
    check_out: isoDate(checkOut),
    booking_value: bookingValue,
    room_nights: nights,
    guest_city: market.city,
    guest_region: market.region,
    guest_country: "United States",
    device: device.device,
    attributed_to_autumn: attributed,
    attribution_type: attributed ? "last_touch" : null,
  };
}

/* ----------------------------------------------------------------- actions */

function makeActions(
  rng: Rng,
  propertyId: string,
  campaignIds: Map<string, string>,
): Array<Record<string, unknown>> {
  const rows: Array<[string, string, string, string, string, string | null]> = [
    ["2025-04-14", "budget_shift", "Moved spend into summer weekends",
      "Weekend arrivals convert best, so budget now front-loads Thursday through Saturday auctions.",
      "completed", "discovery"],
    ["2025-07-02", "creative", "Refreshed lakefront creative",
      "Updated ad imagery and headlines around the harbor and beach access for the summer season.",
      "completed", "discovery"],
    ["2025-10-20", "budget_shift", "Trimmed spend through the shoulder season",
      "Demand softens after leaf season, so pacing was reduced to protect efficiency rather than chase volume.",
      "completed", "discovery"],
    ["2026-01-16", "bidding", "Raised bids on high-intent brand searches",
      "Brand Protection keeps the strongest booking rate, so it now holds top position on searches for the inn by name.",
      "active", "brand"],
    ["2026-03-09", "market_expansion", "Opened Discovery into new metros",
      "Widened Discovery & Competitors beyond Michigan to reach travelers comparing lake towns.",
      "monitoring", "discovery"],
    ["2026-05-21", "market_focus", "Growing Chicago demand",
      "Chicago guests book longer stays than average, so campaign emphasis increased in that market.",
      "active", "metasearch"],
    ["2026-06-18", "landing_page", "Testing a faster booking page",
      "More visitors are arriving than last year while fewer complete a booking, so a shorter booking flow is in test.",
      "monitoring", null],
    ["2026-07-30", "bidding", "Protecting rate on peak weekends",
      "Metasearch bids now hold placement on sold-out weekends only when direct rate is competitive.",
      "active", "metasearch"],
    ["2026-08-24", "creative", "Built shoulder-season stay messaging",
      "September and October creative now leads with quieter beaches and lower midweek rates.",
      "active", "retargeting"],
  ];

  return rows.map(([date, type, title, description, status, campaignKey]) => ({
    id: uuid(rng),
    property_id: propertyId,
    campaign_id: campaignKey ? campaignIds.get(campaignKey) ?? null : null,
    action_date: date,
    action_type: type,
    title,
    description,
    status,
  }));
}
