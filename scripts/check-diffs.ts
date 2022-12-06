import type { SimpleGit } from "simple-git";
import { simpleGit } from "simple-git";

const git: SimpleGit = simpleGit();

async function main() {
  const diffSummary = await git.diffSummary(["HEAD@{1}"]);

  let packagesChanged = false;
  let migrationsChanged = false;
  let datasetsChanged = false;

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
  });

  console.log({ packagesChanged, migrationsChanged, datasetsChanged });
}

main()
  .catch(console.error)
  .finally(() => {
    console.log("done.");
  });
