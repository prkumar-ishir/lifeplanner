import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * getSupabaseBrowserClient lazily instantiates a singleton Supabase JS client.
 * Returning null when env vars are missing keeps the UI functional in local-only mode.
 */
export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn(
      "Supabase credentials are not set yet. Add them to your .env.local file when ready."
    );
    return null;
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return browserClient;
}
