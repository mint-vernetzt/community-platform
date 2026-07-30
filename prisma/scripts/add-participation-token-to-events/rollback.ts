import fs from "fs-extra";
import { prismaClient } from "~/prisma.server";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { program } from "commander";

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
// Get the current directory path
const __dirname = dirname(__filename);

program.requiredOption(
  "-f, --file <file>",
  "The json file that contains the changes that need to be rolled back."
);

program.parse(process.argv);

const options = program.opts();

const entitiesSchema = z.object({
  affectedEvents: z.array(
    z.object({
      id: z.string(),
    })
  ),
});

async function main() {
  process.stdout.write(
    `\nReading migration protocol from json file: ${__dirname}/${options.file}.`
  );
  const protocol = await fs.readJson(`${__dirname}/${options.file}`, {
    encoding: "utf8",
  });
  const result = entitiesSchema.parse(protocol);

  process.stdout.write(" Done. \n");

  console.log(
    `Found ${result.affectedEvents.length} events with participation token to rollback.`
  );

  for (let i = 0; i < result.affectedEvents.length; i++) {
    const event = result.affectedEvents[i];
    await prismaClient.event.update({
      where: {
        id: event.id,
      },
      data: {
        participationToken: null,
      },
    });
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${i + 1}/${result.affectedEvents.length} done.`);
  }

  console.log("\nAll events rolled back successfully.");
}

main()
  .catch((error) => {
    console.error("Error during rollback:", error);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
