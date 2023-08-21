import { program } from "commander";
import { main } from "./src";
import { prismaClient } from "../../../app/prisma.server";

program
  .name("german-states-and-districts-dataset-generator")
  .description(
    "CLI tool to populate the migrated states and district tables with data."
  )
  .version("1.0.0")
  .option(
    "-u, --url <char>",
    "the url of an API with the districts and their states (e.g. https://api.corona-zahlen.org/districts)",
    undefined
  )
  .option(
    "-f, --file <char>",
    "the path to the file with the districts and their states",
    "data/corona-api-06-04-2022.json"
  )
  .option(
    "-s, --stateKey <char>",
    "the key of the objects that holds the state name",
    "state"
  )
  .option(
    "-d, --districtKey <char>",
    "the key of the objects that holds the district name",
    "county"
  )
  .option("-v --verbose", "whether to log the resulting database");

program.parse();

const options = program.opts();

if (options.url) {
  main(options.url, "", options.stateKey, options.districtKey, options.verbose)
    .catch((e) => {
      throw e;
    })
    .finally(async () => {
      await prismaClient.$disconnect();
    });
} else {
  main(
    undefined,
    "../" + options.file,
    options.stateKey,
    options.districtKey,
    options.verbose
  )
    .catch((e) => {
      throw e;
    })
    .finally(async () => {
      await prismaClient.$disconnect();
    });
}
