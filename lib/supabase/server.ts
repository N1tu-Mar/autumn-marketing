import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Read-only Supabase client for Server Components.
 *
 * Uses the publishable (anon) key. Every table has RLS enabled with a
 * select-only demo policy, so this key cannot write. No service-role key is
 * used anywhere in the application — only in the seed script.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export class SupabaseConfigError extends Error {}

export function getSupabase() {
  if (!url || !publishableKey) {
    throw new SupabaseConfigError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "autumn-marketing-dashboard" } },
  });
}

export const isSupabaseConfigured = Boolean(url && publishableKey);
