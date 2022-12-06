import type { SimpleGit } from "simple-git";
import { simpleGit } from "simple-git";
import * as inquirer from "inquirer";

const git: SimpleGit = simpleGit();

async function main() {
  const diffSummary = await git.diffSummary(["HEAD@{1}"]);

  let packagesChanged = false;
  let migrationsChanged = false;
  let datasetsChanged = false;
  let enhancementsChanged = false;

  diffSummary.files.forEach((item) => {
    if (item.file === "package.json" || item.file === "package-lock.json") {
      packagesChanged = true;
    }
    if (item.file.startsWith("prisma/migrations/")) {
      migrationsChanged = true;
    }
    if (item.file.startsWith("prisma/scripts/import-datasets/data/")) {
      datasetsChanged = true;
    }
    if (item.file === "supabase.enhancements.sql") {
      enhancementsChanged = true;
    }
  });

  const prompts = [];
  if (packagesChanged) {
    prompts.push({
      type: "confirm",
      name: "packagesChanged",
      message: "Changes in packages found. Do you want to install packages?",
      default: true,
    });
  }
  if (migrationsChanged) {
    prompts.push({
      type: "confirm",
      name: "migrationsChanged",
      message: "Changes on migrations found. Do you want to run migration?",
      default: true,
    });
  }
  if (datasetsChanged) {
    prompts.push({
      type: "confirm",
      name: "datasetsChanged",
      message: "Changes on datasets found. Do you want to (re-)import data?",
      default: true,
    });
  }
  if (enhancementsChanged) {
    prompts.push({
      type: "list",
      name: "enhancementsChanged",
      message:
        "Changes on supabase enhancement found. Please apply them on your local supabase installation.",
      choices: [],
    });
  }
  inquirer.prompt(prompts).then((answers) => console.log({ answers }));
}

main()
  .catch(console.error)
  .finally(() => {
    console.log("done.");
  });
