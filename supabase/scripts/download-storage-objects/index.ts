import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import fs from "fs-extra";

config({ path: "./supabase/scripts/download-storage-objects/.env" });

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      PROJECT_URL: string;
      PROJECT_SERVICE_KEY: string;
    }
  }
}

const timestamp = Date.now();

async function main() {
  const restClient = createClient(
    process.env.PROJECT_URL,
    process.env.PROJECT_SERVICE_KEY,
    { db: { schema: "storage" } }
  );
  const client = createClient(
    process.env.PROJECT_URL,
    process.env.PROJECT_SERVICE_KEY
  );
  const { data: objects, error } = await restClient.from("objects").select();
  if (error) {
    console.log("error getting objects from old bucket");
    throw error;
  }

  const numberOfObjects = objects.length;
  let objectCount = 0;

  for (const object of objects) {
    console.log(
      `download ${object.id} (${objectCount + 1}/${numberOfObjects})`
    );
    try {
      const { data, error } = await client.storage
        .from(object.bucket_id)
        .download(object.name);
      if (error) {
        throw error;
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // eslint-disable-next-line import/no-named-as-default-member
      await fs.outputFile(
        `./supabase/storage/${timestamp}/${object.bucket_id}/${object.name}`,
        buffer
      );
    } catch (err) {
      console.log("error downloading ", object);
      console.log(err);
    }
    objectCount++;
  }
}

main()
  .catch(console.error)
  .finally(() => console.log("done"));
