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
import { PROPERTY, SEED_END, SEED_START } from "./seed-model";

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

  console.log(`Clearing any existing "${PROPERTY.slug}" demo data…`);
  const { error: deleteError } = await db
    .from("properties")
    .delete()
    .eq("slug", PROPERTY.slug);
  if (deleteError) throw new Error(`delete failed: ${deleteError.message}`);

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
      `  Bookings:          ${data.bookings.length} (${attributed.length} attributed to Autumn)`,
      `  Attributed revenue: $${Math.round(revenue).toLocaleString("en-US")}`,
      `  Autumn actions:    ${data.actions.length}`,
      `  Elapsed:           ${((Date.now() - started) / 1000).toFixed(1)}s`,
      "",
      "This summary is a build-time log. The dashboard recomputes everything from the rows above.",
      "",
    ].join("\n"),
  );
}

main().catch((err) => {
  console.error("\nSeed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
