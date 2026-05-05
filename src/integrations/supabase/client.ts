import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  (typeof process !== "undefined" ? process.env.SUPABASE_ANON_KEY : undefined);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars are not set. Submissions will fail until configured.");
}

export const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});
