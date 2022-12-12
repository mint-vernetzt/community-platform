import { program } from "commander";

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
  // TODO: Generate entity data
  // Upload fake avatars/backgrounds/logos/documents/awardIcons to bucket
  // Call prisma with entity data
}

main(options.force /*, options.add, options.remove*/, options.edgeCases);
