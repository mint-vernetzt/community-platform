import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

declare global {
  var __supabaseClient: SupabaseClient;
}

let client: SupabaseClient;

if (process.env.NODE_ENV === "test") {
  process.env.SUPABASE_URL = "test";
  process.env.SUPABASE_ANON_KEY = "test";
}

if (process.env.NODE_ENV === "production") {
  client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
} else {
  if (global.__supabaseClient === undefined) {
    global.__supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
  client = global.__supabaseClient;
}

export const supabaseClient = client;

export { Session };
