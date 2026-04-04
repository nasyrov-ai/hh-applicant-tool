import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Supabase client for read-only data fetching in Server Components.
 * Does NOT use cookies() — preserves ISR/static generation.
 * Use this for all page-level data fetching where auth is handled by middleware.
 */
export function createStaticSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
