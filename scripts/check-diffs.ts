import type { SimpleGit } from "simple-git";
import { simpleGit } from "simple-git";
import * as inquirer from "inquirer";
import * as childProcess from "node:child_process";
import { promisify } from "node:util";

const asyncExec = promisify(childProcess.exec);

const git: SimpleGit = simpleGit();

console.log("\nChecking diffs... 🔎\n");

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

  if (prompts.length === 0) {
    console.log("\nNothing found. Happy Coding! 🚀\n");
    return;
  }

  const answers = await inquirer.prompt(prompts);
  if (answers.packagesChanged === true) {
    await executeCommand("npm i");
  }
  if (answers.migrationsChanged) {
    await executeCommand("make prisma-migrate");
  }
  if (answers.datasetsChanged) {
    await executeCommand("make import-datasets");
  }
  if (enhancementsChanged) {
    await inquirer.prompt({
      name: "enhancementsChanged",
      message:
        "Changes on supabase enhancements found. Please execute statements on your local supabase instance.",
    });
  }

  console.log("\nDone.\n");
}

async function executeCommand(command: string) {
  try {
    const { stdout, stderr } = await asyncExec(command);
    console.log(stdout);
    console.log(stderr);
  } catch (error) {
    console.error(`\n❌ Running "${command}" failed with\n ${error}\n`);
  }
}

main().catch(console.error);
