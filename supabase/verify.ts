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
import { PROPERTY } from "./seed-model";

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

  check("720+ unique metric dates", uniqueDates.size >= 720, `${uniqueDates.size} dates`);
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
