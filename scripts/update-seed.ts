import { writeFileSync } from "fs";
import { join } from "node:path";

const filename = join(__dirname, "..", "app/lib/no-cache/seed.ts");
const seed = Date.now().toString(36);
writeFileSync(filename, `export const seed = "${seed}"`, { flag: "w" });
console.log(`Updated seed at [${filename}] to [${seed}]`);
