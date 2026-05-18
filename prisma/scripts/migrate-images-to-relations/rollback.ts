import fs from "fs-extra";
import { prismaClient } from "../../../app/prisma.server";

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
  profiles: z.array(
    z.object({
      id: z.string(),
      avatar: z.string().nullable(),
      background: z.string().nullable(),
    })
  ),
  organizations: z.array(
    z.object({
      id: z.string(),
      logo: z.string().nullable(),
      background: z.string().nullable(),
    })
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      logo: z.string().nullable(),
      background: z.string().nullable(),
    })
  ),
  events: z.array(
    z.object({
      id: z.string(),
      background: z.string().nullable(),
    })
  ),
});

const changesSchema = z.object({
  new: entitiesSchema,
  old: entitiesSchema,
});

async function main() {
  // Read changes from json file
  console.log(`Reading changes from json file: ${__dirname}/${options.file}`);
  const anyChanges = await fs.readJson(`${__dirname}/${options.file}`, {
    encoding: "utf8",
  });

  let changes;
  try {
    changes = changesSchema.parse(anyChanges);
  } catch (error) {
    console.error("Error parsing changes.json file", error);
    throw error;
  }

  console.log("Rolling back changes in the database");
  // Save old values in the database
  for (const oldProfile of changes.old.profiles) {
    const { id, ...oldFields } = oldProfile;
    await prismaClient.profile.update({
      where: { id },
      data: {
        ...oldFields,
        avatarImageMetaData:
          oldFields.avatar !== null
            ? {
                delete: true,
              }
            : undefined,
        backgroundImageMetaData:
          oldFields.background !== null
            ? {
                delete: true,
              }
            : undefined,
      },
    });
  }
  for (const oldOrganization of changes.old.organizations) {
    const { id, ...oldFields } = oldOrganization;
    await prismaClient.organization.update({
      where: { id },
      data: {
        ...oldFields,
        logoImageMetaData:
          oldFields.logo !== null
            ? {
                delete: true,
              }
            : undefined,
        backgroundImageMetaData:
          oldFields.background !== null
            ? {
                delete: true,
              }
            : undefined,
      },
    });
  }
  for (const oldProject of changes.old.projects) {
    const { id, ...oldFields } = oldProject;
    await prismaClient.project.update({
      where: { id },
      data: {
        ...oldFields,
        logoImageMetaData:
          oldFields.logo !== null
            ? {
                delete: true,
              }
            : undefined,
        backgroundImageMetaData:
          oldFields.background !== null
            ? {
                delete: true,
              }
            : undefined,
      },
    });
  }
  for (const oldEvent of changes.old.events) {
    const { id, ...oldFields } = oldEvent;
    await prismaClient.event.update({
      where: { id },
      data: {
        ...oldFields,
        backgroundImageMetaData:
          oldFields.background !== null
            ? {
                delete: true,
              }
            : undefined,
      },
    });
  }
  console.log("Rollback successful");
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
