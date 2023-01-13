import { program } from "commander";
import { executeCommand } from "../../../scripts/utils";
// import * as dotenv from "dotenv";
import {
  checkLocalEnvironment,
  createSupabaseAdmin,
  deleteUsers,
  emptyBuckets,
  seedAllEntities,
  truncateTables,
  uploadDocumentBucketData,
  uploadImageBucketData,
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
  .option(
    "-r, --useRealNames",
    "When set, script seeds entities with real names instead of developer friendly names (Developer friendly names describe the type and structure of an entity)."
  );
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
// TODO:
// .option(
//   "-e, --edgeCases",
//   "Also seed edge cases, like the largest possible profile."
// );

program.parse();

const options = program.opts();

const NUMBER_OF_IMAGES = 1; // Must be greater than 0
const NUMBER_OF_DOCUMENTS = 1; // Must be greater than 0
const NUMBER_OF_EVENTS_PER_STRUCTURE = 30; // Must be greater than 1
const NUMBER_OF_STANDARD_ENTITIES = 20; // Must be greater than 20
const DEFAULT_PASSWORD_FOR_PROFILES = "12345678";

async function main(
  force: boolean,
  useRealNames: boolean
  // TODO:
  // add: boolean,
  // remove: boolean,
  // edgeCases: boolean
) {
  // Checking if script is executed on a local environment
  if (!force) {
    console.log("\n--- Checking for local environment ---\n");
    checkLocalEnvironment();
  }

  // Creating an authClient to upload files to the bucket and manage the users table
  console.log("\n--- Creating auth client ---\n");
  const authClient = await createSupabaseAdmin();

  // Truncate database tables, empty buckets and delete users
  console.log("\n--- Reseting database and buckets ---\n");
  await truncateTables();
  await emptyBuckets(authClient);
  await deleteUsers(authClient);
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
  console.log("\n--- Uploading fake images and pdf documents to buckets ---\n");
  const imageBucketData = await uploadImageBucketData(
    authClient,
    NUMBER_OF_IMAGES
  );
  const documentBucketData = await uploadDocumentBucketData(
    authClient,
    NUMBER_OF_DOCUMENTS
  );

  console.log("\n--- Seeding all entities ---\n");
  const profileEmails = await seedAllEntities(
    imageBucketData,
    documentBucketData,
    authClient,
    DEFAULT_PASSWORD_FOR_PROFILES,
    useRealNames,
    NUMBER_OF_EVENTS_PER_STRUCTURE,
    NUMBER_OF_STANDARD_ENTITIES
  );

  console.log("\n--- Seeding finished ---\n");
  console.log("\n--- User list ---\n");
  for (let email of profileEmails) {
    console.log(email);
  }
  console.log(
    `\nThe default password for all users is "${DEFAULT_PASSWORD_FOR_PROFILES}"`
  );

  // TODO: Collect all silent errors in above functions and log them at the end of the script.
}

main(
  options.force,
  options.useRealNames /*, options.add, options.remove, options.edgeCases*/
);
