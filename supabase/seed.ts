/**
 * Writes the generated dataset into the hosted Supabase project.
 *
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * The service role key is used here only — it is never imported by the app.
 *
 * The script is idempotent: it deletes the demo property (cascading to its
 * campaigns, metrics, bookings and actions) and rewrites it from a fixed seed.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { generate } from "./generate";
import { PROPERTY, ROOM_COUNT, SEED_END, SEED_START } from "./seed-model";

config({ path: ".env.local", quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Copy .env.example to .env.local and fill both in.",
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH = 500;

async function insertAll(table: string, rows: Array<Record<string, unknown>>) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await db.from(table).insert(chunk);
    if (error) {
      throw new Error(`insert into ${table} failed at row ${i}: ${error.message}`);
    }
    process.stdout.write(
      `\r  ${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`,
    );
  }
  process.stdout.write("\n");
}

async function main() {
  const started = Date.now();
  console.log("Generating dataset…");
  const data = generate();

  // Capacity gate. A dataset that oversells the building is never written —
  // the run fails loudly instead of quietly shipping impossible numbers.
  const { audit } = data;
  const violations: string[] = [];
  if (audit.peakRoomsSoldOnANight > ROOM_COUNT) {
    violations.push(
      `a night sold ${audit.peakRoomsSoldOnANight} rooms; the property has ${ROOM_COUNT}`,
    );
  }
  if (audit.soldRoomNights > audit.availableRoomNights) {
    violations.push(
      `${audit.soldRoomNights} room nights sold against ${audit.availableRoomNights} available`,
    );
  }
  if (audit.attributedRevenue > audit.modeledRoomRevenue) {
    violations.push(
      "Autumn-attributed revenue exceeds total modeled property revenue",
    );
  }
  if (violations.length > 0) {
    throw new Error(`capacity check failed:\n  - ${violations.join("\n  - ")}`);
  }

  console.log(`Clearing any existing "${PROPERTY.slug}" demo data…`);
  // By slug for a re-seed, and by id because the generator's first UUID is a
  // function of the seed — an earlier demo property can still be holding it.
  for (const [column, value] of [
    ["slug", PROPERTY.slug],
    ["id", data.property.id as string],
  ] as const) {
    const { error } = await db.from("properties").delete().eq(column, value);
    if (error) throw new Error(`delete by ${column} failed: ${error.message}`);
  }

  console.log("Writing rows…");
  await insertAll("properties", [data.property]);
  await insertAll("campaigns", data.campaigns);
  await insertAll("campaign_daily_metrics", data.metrics);
  await insertAll("bookings", data.bookings);
  await insertAll("autumn_actions", data.actions);

  const attributed = data.bookings.filter(
    (b) => b.attributed_to_autumn === true,
  );
  const revenue = attributed.reduce(
    (sum, b) => sum + Number(b.booking_value),
    0,
  );
  const days = new Set(data.metrics.map((m) => m.metric_date as string)).size;

  console.log(
    [
      "",
      "Seed complete",
      `  Property:          ${PROPERTY.name} — ${PROPERTY.city}, ${PROPERTY.state}`,
      `  Date range:        ${SEED_START} → ${SEED_END}`,
      `  Days with metrics: ${days}`,
      `  Campaigns:         ${data.campaigns.length}`,
      `  Metric rows:       ${data.metrics.length}`,
      `  Bookings:          ${data.bookings.length} direct (${attributed.length} attributed to Autumn)`,
      `  Attributed revenue: $${Math.round(revenue).toLocaleString("en-US")}`,
      `  Autumn actions:    ${data.actions.length}`,
      "",
      "  Capacity reconciliation",
      `    Rooms:              ${audit.rooms}`,
      `    Busiest night:      ${audit.peakRoomsSoldOnANight}/${audit.rooms} rooms sold`,
      `    Room nights sold:   ${audit.soldRoomNights.toLocaleString("en-US")} of ${audit.availableRoomNights.toLocaleString("en-US")} available (${((audit.soldRoomNights / audit.availableRoomNights) * 100).toFixed(1)}% occupancy)`,
      `    Modeled room revenue: $${audit.modeledRoomRevenue.toLocaleString("en-US")} across all channels`,
      `    Autumn share of it: ${((audit.attributedRevenue / audit.modeledRoomRevenue) * 100).toFixed(1)}%`,
      `    Bookings lost to a full hotel: ${audit.droppedForNoInventory}`,
      "",
      `  Elapsed:           ${((Date.now() - started) / 1000).toFixed(1)}s`,
      "",
      "This summary is a build-time log. The dashboard recomputes everything from the rows above.",
      "Modeled room revenue is a seed-time figure only — it is never written to the database or rendered.",
      "",
    ].join("\n"),
  );
}

main().catch((err) => {
  console.error("\nSeed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
