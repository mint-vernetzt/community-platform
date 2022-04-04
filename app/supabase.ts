import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

if (process.env.NODE_ENV === "test") {
  process.env.SUPABASE_URL = "test";
  process.env.SUPABASE_ANON_KEY = "test";
}

export const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export { Session };
