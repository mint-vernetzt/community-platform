import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import fs from "fs-extra";
import path from "path";

config({ path: "./supabase/scripts/upload-storage-objects/.env" });

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PROJECT_URL: string;
      PROJECT_SERVICE_KEY: string;
    }
  }
}

const baseDir = "./supabase/storage";

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  const client = createClient(
    process.env.PROJECT_URL,
    process.env.PROJECT_SERVICE_KEY
  );

  // Recursively iterate through ./supabase/storage/ directory
  const filesInDirectory = walk(baseDir);
  const numberOfFiles = filesInDirectory.length;
  let fileCount = 0;

  for (const filePath of filesInDirectory) {
    fileCount++;
    const relative = path.relative(baseDir, filePath);
    const [timestamp, bucketId, mimeType, mimeSubtype, ...nameParts] =
      relative.split(path.sep);
    const mimetype = `${mimeType}/${mimeSubtype}`;
    const name = nameParts.join("/");

    const fileBuffer = await fs.readFile(filePath);
    const data = new Blob([fileBuffer], { type: mimetype });

    try {
      const { error: uploadFileError } = await client.storage
        .from(bucketId)
        .upload(name, data, {
          upsert: true,
          contentType: mimetype,
        });

      if (uploadFileError) {
        console.log("error uploading ", name);
        console.log(uploadFileError);
      }
    } catch (err) {
      console.log("error uploading ", name);
      console.log(err);
    }

    console.log(`processing file ${fileCount}/${numberOfFiles}: ${filePath}`);

    console.log({ timestamp, bucketId, mimetype, name, data });
  }
}

main()
  .catch(console.error)
  .finally(() => console.log("done"));
