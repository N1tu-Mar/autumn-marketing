/**
 * Post-seed data quality gate.
 *
 *   npm run seed:verify
 *
 * Reads the hosted database back and asserts the invariants the dashboard
 * depends on. Exits non-zero on any failure so a bad seed cannot ship.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { PROPERTY, ROOM_COUNT } from "./seed-model";

config({ path: ".env.local", quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase environment variables. See .env.example.");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const checks: Array<[string, boolean, string]> = [];
function check(name: string, passed: boolean, detail: string) {
  checks.push([name, passed, detail]);
}

/** PostgREST caps a single response; page through so counts are exact. */
async function selectAll<T>(
  table: string,
  columns: string,
  propertyId: string,
): Promise<T[]> {
  const page = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += page) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .eq("property_id", propertyId)
      .order("id", { ascending: true })
      .range(from, from + page - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < page) break;
  }
  return out;
}

async function main() {
  const { data: property, error: propError } = await db
    .from("properties")
    .select("id, name, timezone")
    .eq("slug", PROPERTY.slug)
    .single();
  if (propError || !property) {
    console.error(`Property "${PROPERTY.slug}" not found. Run npm run seed first.`);
    process.exit(1);
  }
  const propertyId = property.id as string;

  const campaigns = await selectAll<{ id: string; campaign_type: string }>(
    "campaigns",
    "id, campaign_type",
    propertyId,
  );
  const metrics = await selectAll<{
    metric_date: string; impressions: number; clicks: number;
    website_visits: number; ad_spend: number; campaign_id: string;
  }>(
    "campaign_daily_metrics",
    "id, metric_date, impressions, clicks, website_visits, ad_spend, campaign_id",
    propertyId,
  );
  const bookings = await selectAll<{
    booked_at: string; check_in: string; check_out: string;
    booking_value: number; room_nights: number; guest_city: string | null;
    campaign_id: string | null; attributed_to_autumn: boolean;
  }>(
    "bookings",
    "id, booked_at, check_in, check_out, booking_value, room_nights, guest_city, campaign_id, attributed_to_autumn",
    propertyId,
  );
  const { count: actionCount } = await db
    .from("autumn_actions")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  const campaignIds = new Set(campaigns.map((c) => c.id));
  const uniqueDates = new Set(metrics.map((m) => m.metric_date));
  const years = new Set([...uniqueDates].map((d) => d.slice(0, 4)));
  const cities = new Set(
    bookings.filter((b) => b.attributed_to_autumn).map((b) => b.guest_city),
  );
  const types = new Set(campaigns.map((c) => c.campaign_type));

  check("760+ unique metric dates", uniqueDates.size >= 760, `${uniqueDates.size} dates`);
  check("at least 2 calendar years", years.size >= 2, [...years].sort().join(", "));
  check(
    "impressions >= clicks >= website visits",
    metrics.every((m) => m.impressions >= m.clicks && m.clicks >= m.website_visits),
    `${metrics.length} metric rows`,
  );
  check(
    "all metric values non-negative",
    metrics.every(
      (m) => m.impressions >= 0 && m.clicks >= 0 && m.website_visits >= 0 && m.ad_spend >= 0,
    ),
    "impressions, clicks, visits, spend",
  );
  check(
    "every metric row resolves to a campaign",
    metrics.every((m) => campaignIds.has(m.campaign_id)),
    `${campaignIds.size} campaigns`,
  );
  check(
    "all bookings have positive value",
    bookings.every((b) => Number(b.booking_value) > 0),
    `${bookings.length} bookings`,
  );
  check(
    "check_out > check_in and room_nights > 0",
    bookings.every((b) => b.check_out > b.check_in && b.room_nights > 0),
    "stay integrity",
  );
  check(
    "attributed bookings resolve to a campaign",
    bookings
      .filter((b) => b.attributed_to_autumn)
      .every((b) => b.campaign_id && campaignIds.has(b.campaign_id)),
    `${bookings.filter((b) => b.attributed_to_autumn).length} attributed`,
  );
  check("multiple feeder markets", cities.size >= 5, `${cities.size} markets`);
  check("multiple campaign types", types.size >= 3, [...types].join(", "));
  check("Autumn actions present", (actionCount ?? 0) > 0, `${actionCount ?? 0} actions`);

  /* ---------------------------------------- capacity and revenue reconciliation */
  //
  // `bookings` holds direct reservations only, so what is stored is a subset of
  // the property's occupancy. These are therefore necessary conditions: if the
  // stored subset alone breaks them, the generator is overselling the hotel.

  const occupiedByNight = new Map<string, number>();
  for (const b of bookings) {
    const start = new Date(`${b.check_in}T00:00:00Z`);
    for (let i = 0; i < b.room_nights; i++) {
      const night = new Date(start);
      night.setUTCDate(night.getUTCDate() + i);
      const iso = night.toISOString().slice(0, 10);
      occupiedByNight.set(iso, (occupiedByNight.get(iso) ?? 0) + 1);
    }
  }
  let worstNight = "";
  let worstCount = 0;
  for (const [iso, count] of occupiedByNight) {
    if (count > worstCount) {
      worstCount = count;
      worstNight = iso;
    }
  }

  const stayNights = [...occupiedByNight.keys()].sort();
  const spanDays =
    stayNights.length === 0
      ? 0
      : Math.round(
          (Date.parse(`${stayNights[stayNights.length - 1]}T00:00:00Z`) -
            Date.parse(`${stayNights[0]}T00:00:00Z`)) /
            86_400_000,
        ) + 1;
  const soldRoomNights = bookings.reduce((sum, b) => sum + b.room_nights, 0);
  const availableRoomNights = ROOM_COUNT * spanDays;

  const attributedBookings = bookings.filter((b) => b.attributed_to_autumn);
  const attributedRevenue = attributedBookings.reduce(
    (sum, b) => sum + Number(b.booking_value),
    0,
  );
  const directRevenue = bookings.reduce((sum, b) => sum + Number(b.booking_value), 0);
  const spend = metrics.reduce((sum, m) => sum + Number(m.ad_spend), 0);
  const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

  check(
    `no night sells more than ${ROOM_COUNT} rooms`,
    worstCount <= ROOM_COUNT,
    `busiest stored night ${worstNight || "n/a"} at ${worstCount}/${ROOM_COUNT} rooms`,
  );
  check(
    "room nights fit available inventory",
    soldRoomNights <= availableRoomNights,
    `${soldRoomNights.toLocaleString("en-US")} of ${availableRoomNights.toLocaleString("en-US")} available` +
      (availableRoomNights > 0
        ? ` (${((soldRoomNights / availableRoomNights) * 100).toFixed(1)}% from direct rows alone)`
        : ""),
  );
  check(
    "every booking value is consistent with its stay length",
    bookings.every((b) => {
      const perNight = Number(b.booking_value) / b.room_nights;
      return perNight >= 80 && perNight <= 900;
    }),
    "nightly rate implied by booking_value stays inside a plausible band",
  );
  check(
    "attributed revenue is a subset of direct revenue",
    attributedRevenue <= directRevenue,
    `${usd(attributedRevenue)} attributed of ${usd(directRevenue)} direct`,
  );
  check(
    "ad spend stays below attributed revenue",
    spend < attributedRevenue,
    `${usd(spend)} spend, ${usd(attributedRevenue)} attributed — ROAS ${(attributedRevenue / spend).toFixed(2)}x`,
  );

  let failed = 0;
  console.log(`\nVerifying ${property.name}\n`);
  for (const [name, passed, detail] of checks) {
    if (!passed) failed++;
    console.log(`  ${passed ? "PASS" : "FAIL"}  ${name} — ${detail}`);
  }
  console.log("");
  if (failed > 0) {
    console.error(`${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log("All checks passed.\n");
}

main().catch((err) => {
  console.error("Verification failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
