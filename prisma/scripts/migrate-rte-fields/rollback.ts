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
  profiles: z.array(
    z.object({
      id: z.string(),
      bio: z.string().nullable(),
      bioRTEState: z.string().nullable(),
    })
  ),
  organizations: z.array(
    z.object({
      id: z.string(),
      bio: z.string().nullable(),
      bioRTEState: z.string().nullable(),
    })
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      idea: z.string().nullable(),
      ideaRTEState: z.string().nullable(),
      goals: z.string().nullable(),
      goalsRTEState: z.string().nullable(),
      implementation: z.string().nullable(),
      implementationRTEState: z.string().nullable(),
      furtherDescription: z.string().nullable(),
      furtherDescriptionRTEState: z.string().nullable(),
      targeting: z.string().nullable(),
      targetingRTEState: z.string().nullable(),
      hints: z.string().nullable(),
      hintsRTEState: z.string().nullable(),
      timeframe: z.string().nullable(),
      timeframeRTEState: z.string().nullable(),
      jobFillings: z.string().nullable(),
      jobFillingsRTEState: z.string().nullable(),
      furtherJobFillings: z.string().nullable(),
      furtherJobFillingsRTEState: z.string().nullable(),
      furtherFinancings: z.string().nullable(),
      furtherFinancingsRTEState: z.string().nullable(),
      technicalRequirements: z.string().nullable(),
      technicalRequirementsRTEState: z.string().nullable(),
      furtherTechnicalRequirements: z.string().nullable(),
      furtherTechnicalRequirementsRTEState: z.string().nullable(),
      roomSituation: z.string().nullable(),
      roomSituationRTEState: z.string().nullable(),
      furtherRoomSituation: z.string().nullable(),
      furtherRoomSituationRTEState: z.string().nullable(),
    })
  ),
  events: z.array(
    z.object({
      id: z.string(),
      description: z.string().nullable(),
      descriptionRTEState: z.string().nullable(),
    })
  ),
});

const changesSchema = z.object({
  new: entitiesSchema,
  old: entitiesSchema,
});

async function main() {
  // Save changes in json file
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

  // Save old values in the database
  for (const oldProfile of changes.old.profiles) {
    const { id, ...rteFields } = oldProfile;
    await prismaClient.profile.update({
      where: { id },
      data: rteFields,
    });
  }
  for (const oldOrganization of changes.old.organizations) {
    const { id, ...rteFields } = oldOrganization;
    await prismaClient.organization.update({
      where: { id },
      data: rteFields,
    });
  }
  for (const oldProject of changes.old.projects) {
    const { id, ...rteFields } = oldProject;
    await prismaClient.project.update({
      where: { id },
      data: rteFields,
    });
  }
  for (const oldEvent of changes.old.events) {
    const { id, ...rteFields } = oldEvent;
    await prismaClient.event.update({
      where: { id },
      data: rteFields,
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
