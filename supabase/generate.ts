/**
 * Deterministic dataset generator.
 *
 * Given a fixed seed, this produces byte-identical rows every run, so
 * `npm run seed` is repeatable and reviewable. Nothing here runs at request
 * time — the output is written to Postgres and the app reads it back.
 *
 * Hotel economics are generated before marketing, and a room-night ledger is
 * the spine of the whole thing:
 *
 *   1. every night gets a target number of sold rooms from the occupancy model
 *   2. marketing runs forward: impressions -> clicks -> visits -> bookings
 *   3. each attributed booking must CLAIM inventory for every night of its stay
 *   4. OTA and unattributed-direct stays fill whatever the target still needs
 *
 * No night can ever exceed the property's 19 rooms, because a stay that cannot
 * find inventory is shifted and then dropped rather than overbooked.
 */
import {
  BRAND_CPC_STEP,
  BUDGET_SHIFT,
  CAMPAIGNS,
  DESTINATION_TREND,
  DEVICES,
  DIRECT_BOOKING_SHARE,
  DISCOVERY_EXPANSION,
  EVENTS,
  LEAD_TIME,
  MARKETS,
  MONTH_ADR,
  MONTH_OCCUPANCY,
  NIGHT_WEIGHTS,
  PEAK_NIGHT_WEIGHTS,
  PROGRAM_STRENGTH,
  PROPERTY,
  ROOM_COUNT,
  SEASONAL_CPC,
  SEED_END,
  SEED_START,
  SOFT_PATCH,
  WEEKDAY_ADR,
  WEEKDAY_DEMAND,
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
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

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

function parseDay(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Iterate calendar days in UTC; dates carry no time component. */
function eachDay(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
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
  day >= parseDay(from) && day <= parseDay(to);

const onOrAfter = (day: Date, from: string) => day >= parseDay(from);

/* ------------------------------------------------------ hotel demand model */

/** Stays can start after the metric window closes, so the ledger runs longer. */
const LEDGER_HORIZON_DAYS = 120;

function eventFactor(day: Date, field: "demand" | "adr"): number {
  let factor = 1;
  for (const event of EVENTS) {
    if (inWindow(day, event.from, event.to)) factor *= event[field];
  }
  return factor;
}

/** Share of the 19 rooms sold on this night. Never above 1. */
function occupancyFor(day: Date, rng: Rng): number {
  const season = MONTH_OCCUPANCY[day.getUTCMonth()];
  const weekday = WEEKDAY_DEMAND[day.getUTCDay()];
  const trend = DESTINATION_TREND[day.getUTCFullYear()] ?? 1;
  const soft = inWindow(day, SOFT_PATCH.from, SOFT_PATCH.to)
    ? SOFT_PATCH.multiplier
    : 1;
  const raw =
    season * weekday * trend * soft * eventFactor(day, "demand") * jitter(rng, 0.12);
  return clamp(raw, 0, 1);
}

/** Modeled achieved nightly rate for this date. */
function adrFor(day: Date, rng: Rng): number {
  const drift = 1 + 0.035 * (day.getUTCFullYear() - 2024);
  return (
    MONTH_ADR[day.getUTCMonth()] *
    WEEKDAY_ADR[day.getUTCDay()] *
    eventFactor(day, "adr") *
    drift *
    jitter(rng, 0.06)
  );
}

const MEAN_OCCUPANCY =
  MONTH_OCCUPANCY.reduce((a, b) => a + b, 0) / MONTH_OCCUPANCY.length;

/**
 * How busy the advertising is on a given day. People shop a few weeks before
 * they arrive, so campaign volume leads the arrival curve, and it swings far
 * less across the week than arrivals do.
 */
function marketingIndex(day: Date, rng: Rng): number {
  const shoppingFor = addDays(day, 21);
  const season = MONTH_OCCUPANCY[shoppingFor.getUTCMonth()] / MEAN_OCCUPANCY;
  const weekday = 1 + 0.25 * (WEEKDAY_DEMAND[day.getUTCDay()] - 1);
  const strength = PROGRAM_STRENGTH[day.getUTCFullYear()] ?? 1;
  const soft = inWindow(day, SOFT_PATCH.from, SOFT_PATCH.to)
    ? SOFT_PATCH.multiplier
    : 1;
  return season * weekday * strength * soft * jitter(rng, 0.16);
}

function campaignActiveOn(campaign: CampaignSpec, day: Date): boolean {
  if (day < parseDay(campaign.started_at)) return false;
  if (campaign.ended_at && day > parseDay(campaign.ended_at)) return false;
  return true;
}

function leadTimeFor(month: number, rng: Rng): number {
  const band =
    month >= 5 && month <= 7
      ? LEAD_TIME.peak
      : month >= 3 && month <= 9
        ? LEAD_TIME.shoulder
        : LEAD_TIME.winter;
  return Math.round(between(rng, band.min, band.max));
}

/* ------------------------------------------------------------ room ledger */

/**
 * The physical constraint, in one object. Nothing in this file writes a stay
 * without going through `claim`, so the 19-room ceiling cannot be bypassed.
 */
class RoomLedger {
  private readonly sold = new Map<string, number>();

  constructor(private readonly rooms: number) {}

  soldOn(iso: string): number {
    return this.sold.get(iso) ?? 0;
  }

  canFit(start: Date, nights: number): boolean {
    for (let i = 0; i < nights; i++) {
      if (this.soldOn(isoDate(addDays(start, i))) >= this.rooms) return false;
    }
    return true;
  }

  claim(start: Date, nights: number): boolean {
    if (!this.canFit(start, nights)) return false;
    for (let i = 0; i < nights; i++) {
      const iso = isoDate(addDays(start, i));
      this.sold.set(iso, this.soldOn(iso) + 1);
    }
    return true;
  }

  /** The highest number of rooms sold on any single night. */
  peak(): number {
    let max = 0;
    for (const n of this.sold.values()) max = Math.max(max, n);
    return max;
  }

  totalRoomNights(): number {
    let total = 0;
    for (const n of this.sold.values()) total += n;
    return total;
  }
}

/* ------------------------------------------------------------------ output */

export type GeneratedRows = {
  property: Record<string, unknown>;
  campaigns: Array<Record<string, unknown>>;
  metrics: Array<Record<string, unknown>>;
  bookings: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
  /** Build-time reconciliation figures. Never rendered by the app. */
  audit: {
    rooms: number;
    ledgerDays: number;
    availableRoomNights: number;
    soldRoomNights: number;
    peakRoomsSoldOnANight: number;
    modeledRoomRevenue: number;
    attributedRevenue: number;
    attributedRoomNights: number;
    directStays: number;
    totalStays: number;
    droppedForNoInventory: number;
  };
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

  const windowStart = parseDay(SEED_START);
  const windowEnd = parseDay(SEED_END);
  const bookingDays = eachDay(windowStart, windowEnd);
  const stayDays = eachDay(windowStart, addDays(windowEnd, LEDGER_HORIZON_DAYS));

  /* --- step 1: room inventory, seasonal demand, occupancy, ADR ----------- */

  const targetSold = new Map<string, number>();
  const nightlyAdr = new Map<string, number>();
  for (const day of stayDays) {
    const iso = isoDate(day);
    targetSold.set(iso, Math.min(ROOM_COUNT, Math.round(ROOM_COUNT * occupancyFor(day, rng))));
    nightlyAdr.set(iso, adrFor(day, rng));
  }

  const ledger = new RoomLedger(ROOM_COUNT);
  const metrics: Array<Record<string, unknown>> = [];
  const bookings: Array<Record<string, unknown>> = [];
  let droppedForNoInventory = 0;
  const attributedStaysByYear = new Map<number, number>();
  let attributedRoomNights = 0;
  let attributedRevenue = 0;

  /* --- step 2: marketing funnel, and the bookings it produces ------------ */

  for (const day of bookingDays) {
    const index = marketingIndex(day, rng);
    const month = day.getUTCMonth();

    for (const spec of CAMPAIGNS) {
      if (!campaignActiveOn(spec, day)) continue;
      const campaignId = campaignIds.get(spec.key)!;

      const expansion =
        spec.key === "discovery" &&
        inWindow(day, DISCOVERY_EXPANSION.from, DISCOVERY_EXPANSION.to);
      const shifted = onOrAfter(day, BUDGET_SHIFT.from);
      const budget =
        shifted && spec.key === "discovery"
          ? BUDGET_SHIFT.discoveryImpressionMultiplier
          : shifted && spec.key === "metasearch"
            ? BUDGET_SHIFT.metasearchImpressionMultiplier
            : 1;

      const impressions = Math.max(
        0,
        Math.round(
          spec.baseImpressions *
            index *
            budget *
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

      const cpc =
        spec.cpc *
        (spec.key === "brand" && onOrAfter(day, BRAND_CPC_STEP.from)
          ? BRAND_CPC_STEP.cpcMultiplier
          : 1);
      const spend = clicks * cpc * SEASONAL_CPC[month] * jitter(rng, 0.1);

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
        jitter(rng, 0.18);

      const expected = websiteVisits * conversion;
      const count = Math.floor(expected) + (rng() < expected % 1 ? 1 : 0);

      for (let i = 0; i < count; i++) {
        const stay = placeStay(rng, ledger, day, month);
        if (!stay) {
          // The hotel had no room on any night this guest would accept.
          droppedForNoInventory++;
          continue;
        }
        const row = makeBooking(rng, {
          propertyId, campaignId, bookedOn: day, tz, spec,
          checkIn: stay.checkIn, nights: stay.nights, nightlyAdr,
          attributed: true,
        });
        const year = stay.checkIn.getUTCFullYear();
        attributedStaysByYear.set(year, (attributedStaysByYear.get(year) ?? 0) + 1);
        attributedRoomNights += stay.nights;
        attributedRevenue += Number(row.booking_value);
        bookings.push(row);
      }
    }
  }

  /* --- step 3: fill the rest of each night's demand ---------------------- */
  //
  // Everything Autumn did not produce: OTA reservations and direct bookings
  // that arrived by phone, repeat stay or organic search. OTA stays consume
  // rooms but are never written to `bookings` — that table is direct only,
  // which is exactly what the dashboard queries assume.

  const directProbability = fillDirectProbability(
    stayDays, targetSold, attributedStaysByYear,
  );

  for (const day of stayDays) {
    const iso = isoDate(day);
    const target = targetSold.get(iso) ?? 0;
    let guard = 0;
    while (ledger.soldOn(iso) < target && guard++ < ROOM_COUNT * 2) {
      const isPeak = day.getUTCMonth() >= 5 && day.getUTCMonth() <= 7;
      const nights = pickIndex(rng, isPeak ? PEAK_NIGHT_WEIGHTS : NIGHT_WEIGHTS) + 1;
      if (!ledger.claim(day, nights)) break;

      const year = day.getUTCFullYear();
      const isDirect = rng() < (directProbability.get(year) ?? 0.33);
      const bookedOn = addDays(day, -leadTimeFor(day.getUTCMonth(), rng));
      if (!isDirect) continue;
      // A direct booking made before the dataset opens still occupies the
      // room, but there is no row for it inside the reporting window.
      if (bookedOn < windowStart || bookedOn > windowEnd) continue;

      bookings.push(
        makeBooking(rng, {
          propertyId, campaignId: null, bookedOn, tz, spec: CAMPAIGNS[0],
          checkIn: day, nights, nightlyAdr, attributed: false,
        }),
      );
    }
  }

  const actions = makeActions(rng, propertyId, campaignIds);

  const soldRoomNights = ledger.totalRoomNights();
  let modeledRoomRevenue = 0;
  for (const day of stayDays) {
    const iso = isoDate(day);
    modeledRoomRevenue += ledger.soldOn(iso) * (nightlyAdr.get(iso) ?? 0);
  }

  return {
    property,
    campaigns,
    metrics,
    bookings,
    actions,
    audit: {
      rooms: ROOM_COUNT,
      ledgerDays: stayDays.length,
      availableRoomNights: ROOM_COUNT * stayDays.length,
      soldRoomNights,
      peakRoomsSoldOnANight: ledger.peak(),
      modeledRoomRevenue: Math.round(modeledRoomRevenue),
      attributedRevenue: Math.round(attributedRevenue),
      attributedRoomNights,
      directStays: bookings.length,
      totalStays: Math.round(soldRoomNights / 2.25),
      droppedForNoInventory,
    },
  };
}

/**
 * Per year, how often a fill stay should be a direct booking so that direct
 * lands near DIRECT_BOOKING_SHARE of all stays once Autumn's own bookings are
 * counted. Derived, not hand-tuned, so changing the share stays consistent.
 */
function fillDirectProbability(
  stayDays: Date[],
  targetSold: Map<string, number>,
  attributedStaysByYear: Map<number, number>,
): Map<number, number> {
  const nightsByYear = new Map<number, number>();
  for (const day of stayDays) {
    const year = day.getUTCFullYear();
    nightsByYear.set(
      year,
      (nightsByYear.get(year) ?? 0) + (targetSold.get(isoDate(day)) ?? 0),
    );
  }
  const averageStayLength = 2.25;
  const out = new Map<number, number>();
  for (const [year, nights] of nightsByYear) {
    const totalStays = nights / averageStayLength;
    const attributed = attributedStaysByYear.get(year) ?? 0;
    const fillStays = Math.max(1, totalStays - attributed);
    const wantedDirect = DIRECT_BOOKING_SHARE * totalStays - attributed;
    out.set(year, clamp(wantedDirect / fillStays, 0.05, 0.95));
  }
  return out;
}

/**
 * Find a stay this booking can actually occupy. Guests flex by a few days when
 * their first choice is full; if a whole week is sold out, the booking is lost.
 */
function placeStay(
  rng: Rng,
  ledger: RoomLedger,
  bookedOn: Date,
  month: number,
): { checkIn: Date; nights: number } | null {
  const lead = leadTimeFor(month, rng);
  let checkIn = addDays(bookedOn, lead);
  // Leisure arrivals cluster on Thursday-Saturday.
  if (rng() < 0.6) {
    checkIn = addDays(checkIn, (5 - checkIn.getUTCDay() + 7) % 7);
  }
  const isPeak = checkIn.getUTCMonth() >= 5 && checkIn.getUTCMonth() <= 7;
  const nights = pickIndex(rng, isPeak ? PEAK_NIGHT_WEIGHTS : NIGHT_WEIGHTS) + 1;

  for (let shift = 0; shift <= 6; shift++) {
    const candidate = addDays(checkIn, shift);
    if (ledger.claim(candidate, nights)) return { checkIn: candidate, nights };
  }
  return null;
}

/* ---------------------------------------------------------------- bookings */

function makeBooking(
  rng: Rng,
  ctx: {
    propertyId: string;
    campaignId: string | null;
    bookedOn: Date;
    tz: string;
    spec: CampaignSpec;
    checkIn: Date;
    nights: number;
    nightlyAdr: Map<string, number>;
    attributed: boolean;
  },
): Record<string, unknown> {
  const {
    propertyId, campaignId, bookedOn, tz, spec, checkIn, nights, nightlyAdr, attributed,
  } = ctx;

  const checkOut = addDays(checkIn, nights);

  // Priced night by night, so a stay that spans a rate change is priced right.
  const suite = rng() < 0.08 ? between(rng, 1.3, 1.6) : 1;
  const rateNoise = jitter(rng, 0.08);
  let value = 0;
  for (let i = 0; i < nights; i++) {
    const iso = isoDate(addDays(checkIn, i));
    value += (nightlyAdr.get(iso) ?? MONTH_ADR[addDays(checkIn, i).getUTCMonth()]);
  }
  const bookingValue = Math.max(
    95,
    Math.round(value * spec.adrFactor * suite * rateNoise * 100) / 100,
  );

  const year = checkIn.getUTCFullYear();
  const marketWeights = MARKETS.map((m) => ({
    ...m,
    weight:
      m.weight *
      (year >= 2026 ? m.growth2026 : 1) *
      (attributed && m.region !== "Michigan" ? spec.outStateTilt : 1),
  }));
  const market = pickWeighted(rng, marketWeights);

  // Mobile brings the traffic, desktop closes the booking.
  const device = pickWeighted(
    rng,
    DEVICES.map((d) => ({ ...d, weight: d.weight * d.conversionIndex })),
  );

  // Booking traffic peaks late morning and again after dinner.
  const hour = rng() < 0.45
    ? Math.floor(between(rng, 9, 14))
    : Math.floor(between(rng, 18, 23));
  const bookedAt = zonedWallToUtc(bookedOn, hour, Math.floor(rng() * 60), tz);

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
    ["2024-11-04", "campaign_launch", "Started advertising winter getaways",
      "November through March is your quietest stretch of the year, so your ads now run around Ice Breaker weekend and midweek winter stays.",
      "completed", "winter"],
    ["2025-04-08", "bidding", "Defended your hotel's name in search",
      "Other hotels and booking sites began advertising to travelers who searched for you by name. Your own website now shows first for those searches. It costs a little more, and it keeps guests who already chose you.",
      "completed", "brand"],
    ["2025-06-10", "creative", "Refreshed your summer ads",
      "New photographs and headlines for the season, built around the harbor, the lighthouse walk and downtown.",
      "completed", "discovery"],
    ["2025-07-15", "bidding", "Protected the Blueberry Festival weekend",
      "That August weekend fills early, so your ads now run only where booking with you directly costs the traveler less than the booking sites.",
      "completed", "metasearch"],
    ["2025-10-01", "budget_shift", "Moved spending toward travelers ready to book",
      "Advertising to travelers still choosing a town was drawing visits that rarely became stays. That money now reaches travelers comparing hotels with their dates already set.",
      "completed", "metasearch"],
    ["2025-11-12", "budget_shift", "Slowed spending through a quiet autumn",
      "Demand ran below last year once leaf season ended, so we spent less rather than paying for stays that were not going to come.",
      "completed", "discovery"],
    ["2026-03-09", "market_expansion", "Reached travelers in new cities",
      "Your ads for travelers still deciding where to stay now run beyond Michigan, into Indianapolis, Columbus and Nashville, where people are comparing lake towns.",
      "monitoring", "discovery"],
    ["2026-05-21", "market_focus", "Leaning into Michigan travelers",
      "Michigan cities are producing more stays than the Chicago corridor, so Grand Rapids and Detroit now carry more of your budget.",
      "active", "metasearch"],
    ["2026-06-18", "landing_page", "Testing a faster booking page",
      "More visitors are arriving than last year while fewer finish a booking, so a shorter booking flow is in test.",
      "monitoring", null],
    ["2026-08-24", "creative", "Wrote new ads for September and October",
      "Your autumn ads now lead with quieter beaches, the historic building and lower midweek rates.",
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
