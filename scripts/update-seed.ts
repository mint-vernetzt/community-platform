import { writeFileSync } from "fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filename = join(__dirname, "..", "app/lib/no-cache/seed.ts");
const seed = Date.now().toString(36);
writeFileSync(filename, `export const seed = "${seed}"`, { flag: "w" });
console.log(`Updated seed at [${filename}] to [${seed}]`);
