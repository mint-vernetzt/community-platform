import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

declare global {
  var __supabaseClient: SupabaseClient;
}

let client: SupabaseClient;

if (process.env.NODE_ENV === "test") {
  process.env.SUPABASE_URL = "https://test.com";
  process.env.SUPABASE_ANON_KEY = "test";
  process.env.SERVICE_ROLE_KEY = "test";
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
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY as string
);

// initialize buckets

async function initializeBuckets(buckets: string[]) {
  // for (let i = 0, len = buckets.length; i < len; i++) {
  //   const {error} = await supabaseAdmin.storage.deleteBucket(buckets[i]);
  //   console.log(error);
  // }

  const { data, error } = await supabaseAdmin.storage.listBuckets();

  if (error) {
    throw error;
  }

  if (data === null) {
    throw new Error("Something went wrong initializing buckets");
  }

  const bucketNames = data.map((bucket) => bucket.name);

  const bucketsNotInitialized = buckets.filter(
    (bucketName) => !bucketNames.includes(bucketName)
  );
  const bucketsStillInitialized = bucketsNotInitialized.length === 0;
  if (bucketsStillInitialized) {
    return;
  }

  for (let i = 0, len = bucketsNotInitialized.length; i < len; i++) {
    const { error } = await supabaseAdmin.storage.createBucket(
      bucketsNotInitialized[i],
      { public: true }
    );
    if (error) {
      throw error;
    }
  }
}

const buckets = ["images"];
initializeBuckets(buckets).finally(() =>
  console.log(`Bucket(s) "${buckets.join(", ")}" initialized.`)
);

export { Session };
