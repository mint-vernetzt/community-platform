// @ts-ignore -> This package is not typed
import fs from "fs-extra";
import { prismaClient } from "../../../app/prisma.server";

import { dirname } from "path";
import { fileURLToPath } from "url";

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
// Get the current directory path
const __dirname = dirname(__filename);

async function main() {
  console.log("Retrieving current image data");
  const old = {
    profiles: await prismaClient.profile.findMany({
      select: {
        id: true,
        avatar: true,
        background: true,
      },
    }),
    organizations: await prismaClient.organization.findMany({
      select: {
        id: true,
        logo: true,
        background: true,
      },
    }),
    projects: await prismaClient.project.findMany({
      select: {
        id: true,
        logo: true,
        background: true,
      },
    }),
    events: await prismaClient.event.findMany({
      select: {
        id: true,
        background: true,
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

  console.log("Calculating changes");
  for (const oldProfile of changes.old.profiles) {
    const newProfile = {
      ...oldProfile,
      background: null,
      avatar: null,
      backgroundImage:
        oldProfile.background !== null
          ? {
              create: {
                path: oldProfile.background,
                filename: "TODO:",
                extension: "TODO:",
                sizeInMB: 0,
                mimeType: "TODO:",
              },
            }
          : undefined,
      avatarImage:
        oldProfile.avatar !== null
          ? {
              create: {
                path: oldProfile.avatar,
                filename: "TODO:",
                extension: "TODO:",
                sizeInMB: 0,
                mimeType: "TODO:",
              },
            }
          : undefined,
    };
    changes.new.profiles.push(newProfile);
  }

  for (const oldOrganization of changes.old.organizations) {
    const newOrganization = {
      ...oldOrganization,
      background: null,
      logo: null,
      backgroundImage:
        oldOrganization.background !== null
          ? {
              create: {
                path: oldOrganization.background,
                filename: "TODO:",
                extension: "TODO:",
                sizeInMB: 0,
                mimeType: "TODO:",
              },
            }
          : undefined,
      logoImage:
        oldOrganization.logo !== null
          ? {
              create: {
                path: oldOrganization.logo,
                filename: "TODO:",
                extension: "TODO:",
                sizeInMB: 0,
                mimeType: "TODO:",
              },
            }
          : undefined,
    };
    changes.new.organizations.push(newOrganization);
  }

  for (const oldProject of changes.old.projects) {
    const newProject = {
      ...oldProject,
      background: null,
      logo: null,
      backgroundImage:
        oldProject.background !== null
          ? {
              create: {
                path: oldProject.background,
                filename: "TODO:",
                extension: "TODO:",
                sizeInMB: 0,
                mimeType: "TODO:",
              },
            }
          : undefined,
      logoImage:
        oldProject.logo !== null
          ? {
              create: {
                path: oldProject.logo,
                filename: "TODO:",
                extension: "TODO:",
                sizeInMB: 0,
                mimeType: "TODO:",
              },
            }
          : undefined,
    };
    changes.new.projects.push(newProject);
  }

  for (const oldEvent of changes.old.events) {
    const newEvent = {
      ...oldEvent,
      background: null,
      backgroundImage:
        oldEvent.background !== null
          ? {
              create: {
                path: oldEvent.background,
                filename: "TODO:",
                extension: "TODO:",
                sizeInMB: 0,
                mimeType: "TODO:",
              },
            }
          : undefined,
    };
    changes.new.events.push(newEvent);
  }

  // Save changes in json file
  const currentTimestamp = new Date().toISOString();
  console.log(
    `Saving changes JSON to: ${__dirname}/changes_${currentTimestamp}.json`
  );
  await fs.writeJSON(`${__dirname}/changes_${currentTimestamp}.json`, changes, {
    spaces: 4,
    encoding: "utf8",
  });

  console.log("Migrating images to relations in the database");
  // Save new values in the database
  for (const newProfile of changes.new.profiles) {
    const { id, ...newFields } = newProfile;
    await prismaClient.profile.update({
      where: { id },
      data: {
        ...newFields,
      },
    });
  }
  for (const newOrganization of changes.new.organizations) {
    const { id, ...newFields } = newOrganization;
    await prismaClient.organization.update({
      where: { id },
      data: newFields,
    });
  }
  for (const newProject of changes.new.projects) {
    const { id, ...newFields } = newProject;
    await prismaClient.project.update({
      where: { id },
      data: newFields,
    });
  }
  for (const newEvent of changes.new.events) {
    const { id, ...newFields } = newEvent;
    await prismaClient.event.update({
      where: { id },
      data: newFields,
    });
  }
  console.log("Migrated images successfully");
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
