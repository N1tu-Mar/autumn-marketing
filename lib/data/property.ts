import { cache } from "react";
import { getSupabase } from "@/lib/supabase/server";
import type { Property } from "@/types/database";

/** The demo tenant. A property switcher is out of scope for this assignment. */
export const DEMO_PROPERTY_SLUG = "harborlight-inn";

export class NoDataError extends Error {}

/** `cache` dedupes the lookup across the components of a single render. */
export const getProperty = cache(async (): Promise<Property> => {
  const { data, error } = await getSupabase()
    .from("properties")
    .select("id, slug, name, city, state, country, timezone, room_count, image_url, short_name")
    .eq("slug", DEMO_PROPERTY_SLUG)
    .maybeSingle();

  if (error) throw new Error(`Could not load the property: ${error.message}`);
  if (!data) {
    throw new NoDataError(
      `No property with slug "${DEMO_PROPERTY_SLUG}". Run the migrations and npm run seed.`,
    );
  }
  return data as Property;
});

/**
 * The dashboard is anchored to the newest day of data rather than to the
 * server clock, so ranges always describe a period that actually has rows.
 */
export const getDataThrough = cache(async (propertyId: string): Promise<string> => {
  const { data, error } = await getSupabase().rpc("latest_data_date", {
    p_property: propertyId,
  });
  if (error) throw new Error(`Could not read the latest data date: ${error.message}`);
  if (!data) throw new NoDataError("The property has no campaign metrics yet.");
  return data as string;
});
