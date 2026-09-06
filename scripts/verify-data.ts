/**
 * Production data gate.
 *
 *   npm run verify:data
 *
 * Exits non-zero if anything the dashboard depends on is wrong.
 *
 * This is deliberately different from `npm run seed:verify`
 * (supabase/verify.ts), which checks a freshly generated dataset against the
 * seed model using the service-role key. This script:
 *
 *   * reads through the PRODUCTION path — the publishable/anon key and the same
 *     RPCs the dashboard calls — so it fails when RLS, grants or a stale slug
 *     would leave a real visitor looking at an empty screen, not just when the
 *     rows are wrong;
 *   * imports nothing from the seed model, so it stays a check on the database
 *     rather than a restatement of how the database was written;
 *   * reconciles the aggregates the UI renders against the raw rows they claim
 *     to summarise.
 *
 * Both are worth running. This one is the one that answers "is the deployed
 * dashboard about to show real numbers?".
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

config({ path: ".env.local", quiet: true });

/** The metric history the assignment requires. */
const REQUIRED_METRIC_DAYS = 720;

/** PostgREST caps a single response; page through so totals are exact. */
const PAGE = 1000;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !publishableKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.\n" +
      "These are the variables the application itself reads. See .env.example.",
  );
  process.exit(1);
}

const db = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ------------------------------------------------------------------ checks */

const results: Array<[name: string, passed: boolean, detail: string]> = [];
function check(name: string, passed: boolean, detail = "") {
  results.push([name, passed, detail]);
}

const num = (value: unknown): number => Number(value ?? 0);
const money = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;
const near = (a: number, b: number, epsilon = 0.01) => Math.abs(a - b) <= epsilon;

async function selectAll<T>(
  table: string,
  columns: string,
  propertyId: string,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .eq("property_id", propertyId)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

/**
 * The slug the application asks for, read out of the app's own source.
 *
 * A slug that no longer matches any row is the one failure that leaves the
 * dashboard reachable, connected and completely empty — the deployed build
 * renders its setup notice while the database sits there full of data. Reading
 * the constant rather than restating it means this check cannot drift.
 */
function appPropertySlug(): string {
  const source = readFileSync(
    resolve(process.cwd(), "lib/data/property.ts"),
    "utf8",
  );
  const match = source.match(/DEMO_PROPERTY_SLUG\s*=\s*["']([^"']+)["']/);
  if (!match) throw new Error("Could not read DEMO_PROPERTY_SLUG from lib/data/property.ts");
  return match[1];
}

type MetricRow = {
  campaign_id: string;
  metric_date: string;
  impressions: number;
  clicks: number;
  website_visits: number;
  ad_spend: number;
};

type BookingRow = {
  booked_at: string;
  check_in: string;
  check_out: string;
  booking_value: number;
  room_nights: number;
  guest_city: string | null;
  campaign_id: string | null;
  attributed_to_autumn: boolean;
};

async function main() {
  /* --------------------------------------------------- hosted reachability */

  const host = new URL(url!).host;
  check(
    "Supabase URL is a hosted project, not local",
    /\.supabase\.co$/.test(host) && !/localhost|127\.0\.0\.1/.test(url!),
    host,
  );

  const slug = appPropertySlug();
  const { data: property, error: propertyError } = await db
    .from("properties")
    .select("id, slug, name, timezone, room_count")
    .eq("slug", slug)
    .maybeSingle();

  check(
    "hosted database reachable over the application's own key",
    !propertyError,
    propertyError ? propertyError.message : `connected to ${host}`,
  );
  if (propertyError) return report();

  check(
    `the slug the app requests ("${slug}") exists in the database`,
    Boolean(property),
    property ? (property as { name: string }).name : "no matching property row",
  );
  if (!property) return report();

  const propertyId = (property as { id: string }).id;
  const timezone = (property as { timezone: string }).timezone;
  const roomCount = num((property as { room_count: number }).room_count);

  /* ------------------------------------------------------------- raw rows */

  const campaigns = await selectAll<{ id: string; campaign_type: string }>(
    "campaigns",
    "id, campaign_type",
    propertyId,
  );
  const metrics = await selectAll<MetricRow>(
    "campaign_daily_metrics",
    "id, campaign_id, metric_date, impressions, clicks, website_visits, ad_spend",
    propertyId,
  );
  const bookings = await selectAll<BookingRow>(
    "bookings",
    "id, booked_at, check_in, check_out, booking_value, room_nights, guest_city, campaign_id, attributed_to_autumn",
    propertyId,
  );

  check("campaigns present", campaigns.length > 0, `${campaigns.length} campaigns`);
  check("campaign metrics present", metrics.length > 0, `${metrics.length} daily rows`);
  check("bookings present", bookings.length > 0, `${bookings.length} bookings`);
  if (campaigns.length === 0 || metrics.length === 0 || bookings.length === 0) {
    return report();
  }

  /* --------------------------------------------------------- metric history */

  const metricDates = new Set(metrics.map((m) => m.metric_date));
  const sortedDates = [...metricDates].sort();
  check(
    `>= ${REQUIRED_METRIC_DAYS} unique metric dates`,
    metricDates.size >= REQUIRED_METRIC_DAYS,
    `${metricDates.size} days, ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`,
  );

  /* --------------------------------------------------- marketing invariants */

  const negative = metrics.filter(
    (m) =>
      m.impressions < 0 || m.clicks < 0 || m.website_visits < 0 || num(m.ad_spend) < 0,
  );
  check(
    "no negative marketing metrics",
    negative.length === 0,
    negative.length === 0 ? `${metrics.length} rows` : `${negative.length} rows negative`,
  );

  const ctrBroken = metrics.filter((m) => m.impressions < m.clicks);
  check(
    "impressions >= clicks on every row",
    ctrBroken.length === 0,
    ctrBroken.length === 0 ? "" : `${ctrBroken.length} rows invert`,
  );

  const visitsBroken = metrics.filter((m) => m.clicks < m.website_visits);
  check(
    "clicks >= website visits on every row",
    visitsBroken.length === 0,
    visitsBroken.length === 0 ? "" : `${visitsBroken.length} rows invert`,
  );

  /* ---------------------------------------------------- booking invariants */

  const nonPositive = bookings.filter((b) => num(b.booking_value) <= 0);
  check(
    "every booking value is positive",
    nonPositive.length === 0,
    nonPositive.length === 0 ? `${bookings.length} bookings` : `${nonPositive.length} non-positive`,
  );

  const badStay = bookings.filter(
    (b) => !(b.check_out > b.check_in) || b.room_nights <= 0,
  );
  check(
    "valid stay dates (check_out > check_in, room_nights > 0)",
    badStay.length === 0,
    badStay.length === 0 ? "" : `${badStay.length} invalid stays`,
  );

  const nightsMismatch = bookings.filter((b) => {
    const nights = Math.round(
      (Date.parse(`${b.check_out}T00:00:00Z`) - Date.parse(`${b.check_in}T00:00:00Z`)) /
        86_400_000,
    );
    return nights !== b.room_nights;
  });
  check(
    "room_nights equals the length of the stay",
    nightsMismatch.length === 0,
    nightsMismatch.length === 0 ? "" : `${nightsMismatch.length} rows disagree`,
  );

  /* --------------------------------------------------- referential integrity */

  const campaignIds = new Set(campaigns.map((c) => c.id));
  const orphanMetrics = metrics.filter((m) => !campaignIds.has(m.campaign_id));
  check(
    "every metric row resolves to a campaign of this property",
    orphanMetrics.length === 0,
    orphanMetrics.length === 0 ? `${campaignIds.size} campaigns` : `${orphanMetrics.length} orphans`,
  );

  const attributed = bookings.filter((b) => b.attributed_to_autumn);
  const orphanBookings = attributed.filter(
    (b) => !b.campaign_id || !campaignIds.has(b.campaign_id),
  );
  check(
    "every attributed booking resolves to a campaign",
    orphanBookings.length === 0,
    orphanBookings.length === 0
      ? `${attributed.length} attributed of ${bookings.length}`
      : `${orphanBookings.length} unresolved`,
  );

  const duplicateDay = metrics.length !== new Set(
    metrics.map((m) => `${m.campaign_id}|${m.metric_date}`),
  ).size;
  check("one metric row per campaign per day", !duplicateDay, `${metrics.length} rows`);

  /* --------------------------------------------- capacity, where it is modeled */

  // `bookings` holds direct reservations only, so the stored rows are a subset
  // of real occupancy. These are therefore necessary conditions: if the subset
  // alone breaks them, the data oversells the hotel.
  if (roomCount > 0) {
    const occupied = new Map<string, number>();
    for (const b of bookings) {
      const start = Date.parse(`${b.check_in}T00:00:00Z`);
      for (let i = 0; i < b.room_nights; i++) {
        const iso = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
        occupied.set(iso, (occupied.get(iso) ?? 0) + 1);
      }
    }
    let worstNight = "";
    let worstCount = 0;
    for (const [iso, rooms] of occupied) {
      if (rooms > worstCount) {
        worstCount = rooms;
        worstNight = iso;
      }
    }
    check(
      `no night sells more than the property's ${roomCount} rooms`,
      worstCount <= roomCount,
      `busiest stored night ${worstNight || "n/a"} at ${worstCount}/${roomCount}`,
    );
  } else {
    check("property declares a room count", false, "room_count is null or zero");
  }

  /* ------------------------------------------------------- reconciliation */

  // The dashboard never reads raw rows: it reads these RPCs. Comparing the two
  // is what proves the screen and the database cannot disagree.
  const anchorResult = await db.rpc("latest_data_date", { p_property: propertyId });
  if (anchorResult.error) throw new Error(anchorResult.error.message);
  const anchor = anchorResult.data as string;

  const from = sortedDates[0];
  const to = anchor;

  const [overview, campaignRollup, marketRollup] = await Promise.all([
    db.rpc("overview_metrics", { p_property: propertyId, p_from: from, p_to: to, p_tz: timezone }),
    db.rpc("campaign_performance", { p_property: propertyId, p_from: from, p_to: to, p_tz: timezone }),
    db.rpc("feeder_markets", { p_property: propertyId, p_from: from, p_to: to, p_tz: timezone }),
  ]);
  for (const r of [overview, campaignRollup, marketRollup]) {
    if (r.error) throw new Error(r.error.message);
  }

  const totals = (overview.data as Record<string, unknown>[])[0];
  const byCampaign = campaignRollup.data as Record<string, unknown>[];
  const byMarket = marketRollup.data as Record<string, unknown>[];

  check(
    "the dashboard's aggregation functions are callable by the app's key",
    Boolean(totals),
    "overview_metrics, campaign_performance, feeder_markets, latest_data_date",
  );

  const sum = (rows: Record<string, unknown>[], key: string) =>
    rows.reduce((acc, row) => acc + num(row[key]), 0);

  // Raw rows in the same window, computed independently of Postgres.
  const inWindow = (b: BookingRow) => {
    const day = new Date(b.booked_at).toLocaleDateString("en-CA", { timeZone: timezone });
    return day >= from && day <= to;
  };
  const windowBookings = attributed.filter(inWindow);
  const rawRevenue = windowBookings.reduce((s, b) => s + num(b.booking_value), 0);
  const rawImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const rawClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const rawVisits = metrics.reduce((s, m) => s + m.website_visits, 0);
  const rawSpend = metrics.reduce((s, m) => s + num(m.ad_spend), 0);

  check(
    "booking totals reconcile: headline revenue == sum of booking rows",
    near(num(totals.booking_revenue), rawRevenue, 0.5),
    `${money(num(totals.booking_revenue))} aggregated vs ${money(rawRevenue)} from rows`,
  );
  check(
    "booking totals reconcile: headline count == attributed rows",
    num(totals.bookings) === windowBookings.length,
    `${num(totals.bookings)} vs ${windowBookings.length}`,
  );
  check(
    "marketing totals reconcile: impressions, clicks, visits, spend",
    num(totals.impressions) === rawImpressions &&
      num(totals.clicks) === rawClicks &&
      num(totals.website_visits) === rawVisits &&
      near(num(totals.ad_spend), rawSpend, 0.5),
    `${rawImpressions.toLocaleString("en-US")} impressions, ${rawClicks.toLocaleString("en-US")} clicks, ${rawVisits.toLocaleString("en-US")} visits, ${money(rawSpend)}`,
  );

  check(
    "campaign totals reconcile: revenue",
    near(sum(byCampaign, "booking_revenue"), num(totals.booking_revenue)),
    `${money(sum(byCampaign, "booking_revenue"))} vs ${money(num(totals.booking_revenue))}`,
  );
  check(
    "campaign totals reconcile: bookings",
    sum(byCampaign, "bookings") === num(totals.bookings),
    `${sum(byCampaign, "bookings")} vs ${num(totals.bookings)}`,
  );
  check(
    "campaign totals reconcile: impressions, clicks, visits, spend",
    sum(byCampaign, "impressions") === num(totals.impressions) &&
      sum(byCampaign, "clicks") === num(totals.clicks) &&
      sum(byCampaign, "website_visits") === num(totals.website_visits) &&
      near(sum(byCampaign, "ad_spend"), num(totals.ad_spend)),
    `${byCampaign.length} campaigns`,
  );

  check(
    "feeder markets reconcile: revenue and bookings",
    near(sum(byMarket, "booking_revenue"), num(totals.booking_revenue)) &&
      sum(byMarket, "bookings") === num(totals.bookings),
    `${byMarket.length} markets, ${money(sum(byMarket, "booking_revenue"))}`,
  );
  check(
    "feeder markets reconcile: room nights",
    sum(byMarket, "room_nights") === num(totals.room_nights),
    `${sum(byMarket, "room_nights")} vs ${num(totals.room_nights)}`,
  );

  /* --------------------------------------------------- derived-rate sanity */

  check(
    "aggregate funnel holds: impressions >= clicks >= visits",
    num(totals.impressions) >= num(totals.clicks) &&
      num(totals.clicks) >= num(totals.website_visits),
    `CTR ${((num(totals.clicks) / num(totals.impressions)) * 100).toFixed(2)}%`,
  );
  check(
    "booking conversion is computable and below 100%",
    num(totals.website_visits) > 0 &&
      num(totals.bookings) / num(totals.website_visits) < 1,
    `${((num(totals.bookings) / num(totals.website_visits)) * 100).toFixed(2)}%`,
  );
  check(
    "ROAS is computable from positive ad spend",
    num(totals.ad_spend) > 0,
    `${(num(totals.booking_revenue) / num(totals.ad_spend)).toFixed(2)}x`,
  );

  /* ------------------------------------------------------ narrative inputs */

  const { count: actionCount, error: actionError } = await db
    .from("autumn_actions")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);
  check(
    "Autumn actions readable and present",
    !actionError && (actionCount ?? 0) > 0,
    actionError ? actionError.message : `${actionCount ?? 0} actions`,
  );

  return report();
}

function report() {
  let failed = 0;
  console.log("");
  for (const [name, passed, detail] of results) {
    if (!passed) failed++;
    console.log(`  ${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  }
  console.log("");
  if (failed > 0) {
    console.error(`${failed} of ${results.length} checks failed.\n`);
    process.exit(1);
  }
  console.log(`All ${results.length} checks passed.\n`);
}

main().catch((error) => {
  console.error(
    "\nverify:data could not complete:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
