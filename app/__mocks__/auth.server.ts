import { type SupabaseClient } from "@supabase/supabase-js";
import { beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

beforeEach(() => {
  process.env.SUPABASE_URL = "http://mocked.supabase.url";
  process.env.SUPABASE_ANON_KEY = "123456789";
  process.env.SERVICE_ROLE_KEY = "987654321";
  mockReset(createServerClient);
  mockReset(createClient);
});

export const createServerClient =
  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockDeep<SupabaseClient<any, "public", any>>();

// TODO: fix type issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createClient = mockDeep<SupabaseClient<any, "public", any>>();
