import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = "https://defeeiwpbziodzrbilnj.supabase.co";
const key = "sb_publishable_7mH_5Egludzf0rg5lVp_0Q_301qU7T7";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "kurly-supabase-auth",
      },
    });
  }
  return client;
}
