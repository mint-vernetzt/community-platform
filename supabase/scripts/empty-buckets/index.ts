import { createClient } from "@supabase/supabase-js";
import { program } from "commander";
import * as dotenv from "dotenv";

dotenv.config({ path: "./.env" });

program
  .name("empty-buckets")
  .description(`CLI tool to empty the storage buckets on supabase.`)
  .version("1.0.0");

program.parse();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY;
  if (supabaseUrl === undefined) {
    throw new Error(
      "No SUPABASE_URL provided via the .env file. Buckets could not be created."
    );
  }
  if (supabaseServiceRoleKey === undefined) {
    throw new Error(
      "No SERVICE_ROLE_KEY provided via the .env file. Buckets could not be created."
    );
  }
  const authClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error: imageBucketError } = await authClient.storage.emptyBucket(
    "images"
  );
  const { error: documentBucketError } = await authClient.storage.emptyBucket(
    "documents"
  );
  if (imageBucketError !== null) {
    console.error(
      "The image bucket could not be emptied. Please try to manually empty it (f.e. via Supabase Studio). If you don't have a bucket named 'images', please run the create-buckets script located in ./supabase/create-buckets/index.ts."
    );
  }
  if (documentBucketError !== null) {
    console.error(
      "The document bucket could not be emptied. Please try to manually empty it (f.e. via Supabase Studio). If you don't have a bucket named 'documents', please run the create-buckets script located in ./supabase/create-buckets/index.ts."
    );
  }
  console.log(`Successfully emptied buckets: "images", "documents"`);
}

main();
