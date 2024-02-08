import { executeCommand } from "./utils";
import * as dotenv from "dotenv";

dotenv.config({ path: "./.env" });

console.log("\nUploading sourcemaps to sentry...\n");

async function main() {
  await executeCommand("npx", [
    "sentry-upload-sourcemaps",
    "--org",
    process.env.SENTRY_ORGANIZATION_NAME,
    "--project",
    process.env.SENTRY_PROJECT_NAME,
  ]);

  console.log("\nDone.\n");
}

main().catch(console.error);
