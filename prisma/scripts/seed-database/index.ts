import { program } from "commander";
import { executeCommand } from "scripts/utils";
// import * as dotenv from "dotenv";
import {
  checkLocalEnvironment,
  createSupabaseAdmin,
  truncateTables,
  seedAllEntities,
  setFakerLocale,
  setFakerSeed,
  uploadDocumentBucketData,
  uploadImageBucketData,
  emptyBuckets,
} from "./utils";

// dotenv.config({ path: "./.env" });

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

const NUMBER_OF_IMAGES = 1;
const NUMBER_OF_DOCUMENTS = 1;

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

  // Set faker locale
  setFakerLocale("de");

  // Set faker seed to receive the same random results whenever this script is executed
  setFakerSeed(123);

  // Truncate database tables and empty buckets
  await truncateTables();
  await emptyBuckets(authClient);
  await executeCommand("npm", ["run", "prisma:migrate"]);
  await executeCommand("npx", [
    "ts-node",
    "prisma/scripts/german-states-and-districts-dataset/load-german-states-and-districts.ts",
  ]);
  await executeCommand("npx", [
    "ts-node",
    "prisma/scripts/import-datasets/index.ts",
  ]);

  // Upload fake avatars/backgrounds/logos/documents/awardIcons to bucket
  const imageBucketData = await uploadImageBucketData(
    authClient,
    NUMBER_OF_IMAGES
  );
  const documentBucketData = await uploadDocumentBucketData(
    authClient,
    NUMBER_OF_DOCUMENTS
  );

  const profileCredentials = await seedAllEntities(
    imageBucketData,
    documentBucketData
  );

  console.log(profileCredentials);

  // TODO: Create corresponding users (pw: 12345678) on supabase auth.users table (see supabase local auth.users table and login.func.tsx for example)

  // TODO: Log the profile list with emails and password: 12345678

  // TODO: Collect all silent errors in above functions and log them at the end of the script.
}

main(options.force /*, options.add, options.remove*/, options.edgeCases);
