import { program } from "commander";
import * as inquirer from "inquirer";

import {
  createEventVisibilitySettings,
  createOrganizationVisibilitySettings,
  createProfileVisibilitySettings,
  createProjectVisibilitySettings,
} from "./utils";

program
  .option(
    "-f, --force",
    "This enables to run force visibility creation if visibilities exist."
  )
  .parse();

const args = program.opts();

async function main() {
  const prompts = [];
  if (args.force) {
    console.log("\nForce visibility creation enabled.\n");
    prompts.push({
      type: "confirm",
      name: "force",
      message: "Force visibility creation enabled. Do you want to continue?",
      default: false,
    });
  }

  const options = (await inquirer.prompt(prompts)) as { force: boolean };

  await createProfileVisibilitySettings(options);
  await createOrganizationVisibilitySettings(options);
  await createEventVisibilitySettings(options);
  await createProjectVisibilitySettings(options);

  console.log("Done.");
}

main().catch(console.error);
