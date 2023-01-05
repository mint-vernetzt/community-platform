import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { program } from "commander";
import * as dotenv from "dotenv";
import { fromBuffer } from "file-type";
import { generatePathName } from "../../../app/storage.server";
import { createHashFromString } from "../../../app/utils.server";
import type { ImageType } from "./utils";
import { getImageUrl } from "./utils";

dotenv.config({ path: "./.env" });

program
  .name("seed-database")
  .description(`CLI tool to seed the database with random but reasonably data.`)
  .version("1.0.0")
  .option(
    "-f, --force",
    "This enables to run the script outside a local development environment."
  )
  // TODO:
  // .option(
  //   "-a, --add",
  //   "When set, the script appends the seeded data to exisiting data on the database. That can cause conflicts, that have to be resolved manually (e.g. uniqueness)."
  // )
  // TODO:
  // .option(
  //   "-r, --remove",
  //   "Removes only the seeded data from the database."
  // )
  .option(
    "-e, --edgeCases",
    "Also seed edge cases, like the largest possible profile."
  );

program.parse();

const options = program.opts();

function checkLocalEnvironment() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) {
    throw new Error(
      "No database url provided via the .env file. Database could not be seeded."
    );
  }
  if (!databaseUrl.includes("localhost:")) {
    throw new Error(
      "You are not seeding the database on a local environment. All data will be dropped when you seed the database with this script. If you intended to run this script on a production environment please use the --force flag."
    );
  }
}

async function createSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY;
  if (supabaseUrl === undefined) {
    throw new Error(
      "No SUPABASE_URL provided via the .env file. Database could not be seeded."
    );
  }
  if (supabaseServiceRoleKey === undefined) {
    throw new Error(
      "No SERVICE_ROLE_KEY provided via the .env file. Database could not be seeded."
    );
  }
  const authClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  return authClient;
}

async function uploadImageBucketData(
  authClient: SupabaseClient<any, "public", any>
) {
  let bucketData: {
    [key in ImageType]: string[];
  } = {
    avatars: [],
    logos: [],
    backgrounds: [],
  };

  console.log("Fetching images from @faker-js/faker image api");
  try {
    for (const imageType in bucketData) {
      // TODO: Specify how much images should be loaded
      for (let i = 1; i <= 50; i++) {
        const imgUrl = getImageUrl(imageType as ImageType);
        const response = await fetch(imgUrl);
        if (response.status !== 200) {
          console.error(
            `\n!!!\nUnable to fetch image from ${imgUrl}. Received status code ${response.status}: ${response.statusText}\n!!!\n`
          );
          continue;
        } else {
          console.log(`Successfully fetched image from ${imgUrl}.`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const fileTypeResult = await fromBuffer(arrayBuffer);
        if (fileTypeResult === undefined) {
          console.error(
            "The MIME-type could not be read. The file was left out."
          );
          continue;
        }
        if (!fileTypeResult.mime.includes("image/")) {
          console.error(
            "The file is not an image as it does not have an image/* MIME-Type. The file was left out."
          );
          continue;
        }
        const hash = await createHashFromString(
          Buffer.from(arrayBuffer).toString()
        );
        const path = generatePathName(
          fileTypeResult.ext,
          hash,
          imageType.substring(0, imageType.length - 1)
        );
        const { error: uploadObjectError } = await authClient.storage
          .from("images")
          .upload(path, arrayBuffer, {
            upsert: true,
            contentType: fileTypeResult.mime,
          });
        if (uploadObjectError) {
          console.error(
            "The image could not be uploaded and was left out. Following error occured:",
            uploadObjectError
          );
          continue;
        }
        bucketData[imageType as ImageType].push(path);
      }
    }
  } catch (e) {
    console.log(e);
    console.error("\nCould not fetch images from pravatar.cc:\n");
    throw e;
  }
  return bucketData;
}

async function main(
  force: boolean,
  // TODO:
  // add: boolean,
  // remove: boolean,
  edgeCases: boolean
) {
  // Checking if script is executed on a local environment
  if (!force) {
    checkLocalEnvironment();
  }

  // Creating an authClient to upload files to the bucket and manage the users table
  const authClient = await createSupabaseAdmin();

  // TODO: Upload fake avatars/backgrounds/logos/documents/awardIcons to bucket
  const bucketData = await uploadImageBucketData(authClient);

  console.log(bucketData);

  // setFakerSeed(123);

  // TODO: Generate entity data for each entityType and entityStructure
  // TODO: Create global constants to enable easy configuring (f.e. number of profiles, etc...) / Maybe include some of them in the script options
  // TODO: Define and implement edge cases in getEntityData()
  // const award = getEntityData<"award">("award", "Standard", 0, {
  //   logo: { path: "" },
  // });

  // TODO: Create corresponding users (pw: 12345678) on supabase auth.users table (see supabase local auth.users table and login.func.tsx for example)

  // Seed db via prisma call
  // seedEntity<"award">("award", award);

  // TODO: Log the profile list with emails and password: 12345678
}

main(options.force /*, options.add, options.remove*/, options.edgeCases);
