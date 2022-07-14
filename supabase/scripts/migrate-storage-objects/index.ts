import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: "./supabase/scripts/migrate-storage-objects/.env" });

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OLD_PROJECT_URL: string;
      OLD_PROJECT_SERVICE_KEY: string;
      NEW_PROJECT_URL: string;
      NEW_PROJECT_SERVICE_KEY: string;
    }
  }
}

async function main() {
  const oldRestClient = createClient(
    process.env.OLD_PROJECT_URL,
    process.env.OLD_PROJECT_SERVICE_KEY,
    { schema: "storage" }
  );
  const oldClient = createClient(
    process.env.OLD_PROJECT_URL,
    process.env.OLD_PROJECT_SERVICE_KEY
  );
  const newClient = createClient(
    process.env.NEW_PROJECT_URL,
    process.env.NEW_PROJECT_SERVICE_KEY
  );

  const { data: oldObjects, error } = await oldRestClient
    .from("objects")
    .select();
  if (error) {
    console.log("error getting objects from old bucket");
    throw error;
  }

  for (const objectData of oldObjects) {
    console.log(`moving ${objectData.id}`);
    try {
      const { data, error: downloadObjectError } = await oldClient.storage
        .from(objectData.bucket_id)
        .download(objectData.name);
      if (downloadObjectError) {
        throw downloadObjectError;
      }

      const { error: uploadObjectError } = await newClient.storage
        .from(objectData.bucket_id)
        .upload(objectData.name, data as Blob, {
          upsert: true,
          contentType: objectData.metadata.mimetype,
          cacheControl: objectData.metadata.cacheControl,
        });
      if (uploadObjectError) {
        throw uploadObjectError;
      }
    } catch (err) {
      console.log("error moving ", objectData);
      console.log(err);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => console.log("done"));
