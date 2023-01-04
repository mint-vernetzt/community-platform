import { program } from "commander";
import { getEntityData, seedEntity, setFakerSeed } from "./utils";
import * as dotenv from "dotenv";

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

async function main(
  force: boolean,
  // TODO:
  // add: boolean,
  // remove: boolean,
  edgeCases: boolean
) {
  if (!force) {
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

  // TODO: Upload fake avatars/backgrounds/logos/documents/awardIcons to bucket

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
