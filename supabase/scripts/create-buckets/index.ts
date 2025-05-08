import { createClient } from "@supabase/supabase-js";
import { program } from "commander";
import { config } from "dotenv";

config({ path: "./.env" });

program
  .name("create-buckets")
  .description(`CLI tool to create the storage buckets on supabase.`)
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

  const { data: imageBucketData } = await authClient.storage.getBucket(
    "images"
  );
  if (imageBucketData !== null) {
    console.log(`Bucket "images" already exists. Skipping creation.`);
  } else {
    const { data, error } = await authClient.storage.createBucket("images", {
      public: true,
    });
    if (data === null || error !== null) {
      console.error(`The bucket could not be created due to following error:`);
      console.error(error.name, error.message);
    } else {
      console.log(data);
      console.log(`Successfully created bucket "images"`);
    }
  }
  const { data: documentBucketData } = await authClient.storage.getBucket(
    "documents"
  );
  if (documentBucketData !== null) {
    console.log(`Bucket "documents" already exists. Skipping creation.`);
  } else {
    const { data, error } = await authClient.storage.createBucket("documents", {
      public: true,
    });
    if (data === null || error !== null) {
      console.error(`The bucket could not be created due to following error:`);
      console.error(error.name, error.message);
    } else {
      console.log(data);
      console.log(`Successfully created bucket "documents"`);
    }
  }
}

main();
