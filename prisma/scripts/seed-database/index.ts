import { InvalidArgumentError, program } from "commander";
import { executeCommand } from "../../../scripts/utils";
// import * as dotenv from "dotenv";
import {
  checkLocalEnvironment,
  createSupabaseAdmin,
  seedAllEntities,
  uploadDocumentBucketData,
  uploadImageBucketData,
} from "./utils";

// Next time when touching this:
/*
Flatten the structure:
- index.ts -> Stays the same (Top-Level script)
- profileSeeder.ts -> getEntityData<profile>("Standard", ...) should be getProfileData("Standard", ...)
- organizationSeeder.ts -> same as above
- projectSeeder.ts -> same as above
- eventSeeder.ts -> same as above
- documentSeeder.ts -> same as above
- awardSeeder.ts -> same as above
- entityConnector -> Store all functions that connect entities (f.e. connectProfileWithOrganization(profileId, organizationId), ...)
- utils.ts -> Store all other functions (f.e. bucket and table handling, checking environment, seedAllEntities(), ...)
*/

// TODO: Add this to script flags with default values
const NUMBER_OF_IMAGES = 50; // Must be greater than 0
const NUMBER_OF_DOCUMENTS = 10; // Must be greater than 0
const NUMBER_OF_EVENTS_PER_STRUCTURE = 20; // Must be greater or equal to 0 (>=20 for good results)
const NUMBER_OF_STANDARD_ENTITIES = 20; // Must be greater than 1 (>=20 for good results)
const DEFAULT_PASSWORD_FOR_PROFILES = "12345678"; // Must be at least 8 characters long

function commanderParseInt(value: string) {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError("Not a number.");
  }
  return parsedValue;
}

program
  .name("seed-database")
  .description(`CLI tool to seed the database with random but reasonably data.`)
  .version("1.0.0")
  .option(
    "-f, --force",
    "This enables to run the script outside a local development environment."
  )
  .option(
    "-i, --numberOfImages <number>",
    `The number of different images for each image type (avatar, logo, background) that are fetched from '@faker-js/faker' and uploaded to bucket images. Defaults to '${NUMBER_OF_IMAGES}'. Must be greater than 0.`,
    commanderParseInt,
    NUMBER_OF_IMAGES
  )
  .option(
    "-d, --numberOfDocuments <number>",
    `The number of different documents that are created via 'pdf-lib' and uploaded to bucket documents. Defaults to '${NUMBER_OF_DOCUMENTS}'. Must be greater than 0.`,
    commanderParseInt,
    NUMBER_OF_DOCUMENTS
  )
  .option(
    "-e, --numberOfEvents <number>",
    `The number of seeded events per event structure (Standard Event, Developer Event, Canceled Event, ...). Defaults to '${NUMBER_OF_EVENTS_PER_STRUCTURE}'. Must be greater or equal to 0.`,
    commanderParseInt,
    NUMBER_OF_EVENTS_PER_STRUCTURE
  )
  .option(
    "-s, --numberOfStandardEntities <number>",
    `The number of seeded standard entities. Defaults to '${NUMBER_OF_STANDARD_ENTITIES}'. Standard entities are used as fillers (f.e. standard profiles used as random participants for an event, etc...). Must be greater than 1.`,
    commanderParseInt,
    NUMBER_OF_STANDARD_ENTITIES
  )
  .option(
    "-p, --defaultPassword <char>",
    `The default password for all seeded profiles. Defaults to '${DEFAULT_PASSWORD_FOR_PROFILES}'. Must be at least 8 characters long.`,
    DEFAULT_PASSWORD_FOR_PROFILES
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

async function main(
  force: boolean,
  numberOfImages: number,
  numberOfDocuments: number,
  numberOfEvents: number,
  numberOfStandardEntities: number,
  defaultPassword: string,
  useRealNames: boolean
  // TODO:
  // add: boolean,
  // remove: boolean,
  // edgeCases: boolean
) {
  // Validating program options inputs
  if (numberOfImages <= 0) {
    throw new InvalidArgumentError("Number of images must be greater than 0.");
  }
  if (numberOfDocuments <= 0) {
    throw new InvalidArgumentError(
      "Number of documents must be greater than 0."
    );
  }
  if (numberOfEvents < 0) {
    throw new InvalidArgumentError(
      "Number of events must be greater or equal to 0."
    );
  }
  if (numberOfStandardEntities <= 1) {
    throw new InvalidArgumentError(
      "Number of standard entities must be greater than 1."
    );
  }
  if (defaultPassword.length < 8) {
    throw new InvalidArgumentError(
      "The password must be at least 8 characters long."
    );
  }

  // Checking if script is executed on a local environment
  if (!force) {
    console.log("\n--- Checking for local environment ---\n");
    checkLocalEnvironment();
  }

  // Truncate database tables, create/empty buckets and delete users
  console.log("\n--- Reseting database and buckets ---\n");
  await executeCommand("npx", [
    "tsx",
    "prisma/scripts/truncate-tables/index.ts",
  ]);
  await executeCommand("npm", ["run", "prisma:migrate"]);
  await executeCommand("npx", [
    "tsx",
    "prisma/scripts/german-states-and-districts-dataset/load-german-states-and-districts.ts",
  ]);
  await executeCommand("npx", [
    "tsx",
    "prisma/scripts/import-datasets/index.ts",
  ]);
  await executeCommand("npx", [
    "tsx",
    "supabase/scripts/create-buckets/index.ts",
  ]);
  await executeCommand("npx", [
    "tsx",
    "supabase/scripts/empty-buckets/index.ts",
  ]);
  await executeCommand("npx", [
    "tsx",
    "prisma/scripts/apply-bucket-rls/index.ts",
  ]);
  await executeCommand("npx", [
    "tsx",
    "supabase/scripts/delete-users/index.ts",
  ]);

  // Creating an authClient to upload files to the bucket and manage the users table
  console.log("\n--- Creating auth client ---\n");
  const authClient = await createSupabaseAdmin();

  // Upload fake avatars/backgrounds/logos/documents/awardIcons to bucket
  console.log("\n--- Uploading fake images and pdf documents to buckets ---\n");
  const imageBucketData = await uploadImageBucketData(
    authClient,
    numberOfImages
  );
  const documentBucketData = await uploadDocumentBucketData(
    authClient,
    numberOfDocuments
  );

  console.log("\n--- Seeding all entities ---\n");
  const profileEmails = await seedAllEntities(
    imageBucketData,
    documentBucketData,
    authClient,
    defaultPassword,
    useRealNames,
    numberOfEvents,
    numberOfStandardEntities
  );

  console.log("\n--- Seeding finished ---\n");
  console.log("\n--- User list ---\n");
  for (let email of profileEmails) {
    console.log(email);
  }
  console.log(`\nThe default password for all users is "${defaultPassword}"`);

  // TODO: Collect all silent errors in above functions and log them at the end of the script.
}

main(
  options.force,
  options.numberOfImages,
  options.numberOfDocuments,
  options.numberOfEvents,
  options.numberOfStandardEntities,
  options.defaultPassword,
  options.useRealNames /*, options.add, options.remove, options.edgeCases*/
);
