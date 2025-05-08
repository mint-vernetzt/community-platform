// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -> This package is not typed
import fs from "fs-extra";
import { prismaClient } from "../../../app/prisma.server";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { sanitizeUserHtml } from "../../../app/utils.server";

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
// Get the current directory path
const __dirname = dirname(__filename);

async function main() {
  console.log("\nCollecting old RTE fields...                       [x---]");
  const old = {
    profiles: await prismaClient.profile.findMany({
      select: {
        id: true,
        bio: true,
      },
    }),
    organizations: await prismaClient.organization.findMany({
      select: {
        id: true,
        bio: true,
      },
    }),
    projects: await prismaClient.project.findMany({
      select: {
        id: true,
        idea: true,
        goals: true,
        implementation: true,
        furtherDescription: true,
        targeting: true,
        hints: true,
        timeframe: true,
        jobFillings: true,
        furtherJobFillings: true,
        furtherFinancings: true,
        technicalRequirements: true,
        furtherTechnicalRequirements: true,
        roomSituation: true,
        furtherRoomSituation: true,
      },
    }),
    events: await prismaClient.event.findMany({
      select: {
        id: true,
        description: true,
      },
    }),
  };
  const changes: {
    old: typeof old;
    new: typeof old;
  } = {
    old,
    new: {
      profiles: [],
      organizations: [],
      projects: [],
      events: [],
    },
  };

  console.log("Sanitizing old RTE Fields...                       [xx--]");
  // Send all rte fields through the new hydrated RTE component, which transforms the old HTML to the new HTML
  // Did each entity on its own to get typescript support. Typescript cannot resolve the type on the third nested for loop.
  for (const oldProfile of changes.old.profiles) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rteFields } = oldProfile;
    const newProfile = { ...oldProfile };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (rteFields[typedRteField] !== null) {
        newProfile[typedRteField] = sanitizeUserHtml(rteFields[typedRteField]);
      }
    }
    changes.new.profiles.push(newProfile);
  }

  for (const oldOrganization of changes.old.organizations) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rteFields } = oldOrganization;
    const newOrganization = { ...oldOrganization };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (rteFields[typedRteField] !== null) {
        newOrganization[typedRteField] = sanitizeUserHtml(
          rteFields[typedRteField]
        );
      }
    }
    changes.new.organizations.push(newOrganization);
  }

  for (const oldProject of changes.old.projects) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rteFields } = oldProject;
    const newProject = { ...oldProject };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (rteFields[typedRteField] !== null) {
        newProject[typedRteField] = sanitizeUserHtml(rteFields[typedRteField]);
      }
    }
    changes.new.projects.push(newProject);
  }

  for (const oldEvent of changes.old.events) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rteFields } = oldEvent;
    const newEvent = { ...oldEvent };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (rteFields[typedRteField] !== null) {
        newEvent[typedRteField] = sanitizeUserHtml(rteFields[typedRteField]);
      }
    }
    changes.new.events.push(newEvent);
  }

  console.log("Writing changes JSON...                            [xxx-]");
  // Save changes in json file
  const currentTimestamp = new Date().toISOString();
  // eslint-disable-next-line import/no-named-as-default-member
  fs.writeJSON(`${__dirname}/changes_${currentTimestamp}.json`, changes, {
    spaces: 4,
    encoding: "utf8",
  });

  console.log("Updating RTE fields in db to new values...         [xxxx]");
  // Save new values in the database
  for (const newProfile of changes.new.profiles) {
    const { id, ...rteFields } = newProfile;
    await prismaClient.profile.update({
      where: { id },
      data: rteFields,
    });
  }
  for (const newOrganization of changes.new.organizations) {
    const { id, ...rteFields } = newOrganization;
    await prismaClient.organization.update({
      where: { id },
      data: rteFields,
    });
  }
  for (const newProject of changes.new.projects) {
    const { id, ...rteFields } = newProject;
    await prismaClient.project.update({
      where: { id },
      data: rteFields,
    });
  }
  for (const newEvent of changes.new.events) {
    const { id, ...rteFields } = newEvent;
    await prismaClient.event.update({
      where: { id },
      data: rteFields,
    });
  }
  console.log("Sanitized RTE fields successfully");
  console.log("For changes see ./changes.json");
  console.log("For rollback see ./rollback.ts");
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
