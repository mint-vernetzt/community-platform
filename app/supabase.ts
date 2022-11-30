import { createClient } from "@supabase/supabase-js";

// initialize buckets

async function initializeBuckets(buckets: string[]) {
  // for (let i = 0, len = buckets.length; i < len; i++) {
  //   const {error} = await supabaseAdmin.storage.deleteBucket(buckets[i]);
  //   console.log(error);
  // }
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY as string
  );

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

const buckets = ["images", "documents"];
initializeBuckets(buckets).finally(() =>
  console.log(`Bucket(s) "${buckets.join(", ")}" initialized.`)
);

export {};
