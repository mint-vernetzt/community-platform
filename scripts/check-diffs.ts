import type { SimpleGit } from "simple-git";
import { simpleGit } from "simple-git";

const git: SimpleGit = simpleGit();

async function main() {
  const summary = await git.diffSummary(["@{-1}"]);
  console.log({ summary });

  const packagesChanged = summary.files.some(
    (item) => item.file === "package.json" || item.file === "package-lock.json"
  );

  console.log({ packagesChanged });
}

main()
  .catch(console.error)
  .finally(() => {
    console.log("done.");
  });
