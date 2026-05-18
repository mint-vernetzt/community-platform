// @ts-ignore -> This package is not typed
import fs from "fs-extra";
import { prismaClient } from "../../../app/prisma.server";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { createAdminAuthClient } from "~/auth.server";
import { fileTypeFromBlob } from "file-type";
import { IMAGE_MIME_TYPES } from "~/storage.shared";

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

  console.log("Calculate metadata from existing images in storage");
  const authClient = createAdminAuthClient();
  const metaDataByPath = new Map<
    string,
    {
      path: string;
      filename: string;
      extension: string;
      sizeInMB: number;
      mimeType: string;
    }
  >();

  for (const oldProfile of changes.old.profiles) {
    if (oldProfile.background !== null) {
      const { error, data: blob } = await authClient.storage
        .from("images")
        .download(oldProfile.background);
      if (error !== null || blob === null) {
        console.error(
          `Could not retrieve background image for profile with id ${oldProfile.id}. Skipping this profile for migration. Error: ${error}`
        );
        continue;
      }
      const fileType = await fileTypeFromBlob(blob);
      if (typeof fileType === "undefined") {
        console.error(
          `Could not determine file type for background image for profile with id ${oldProfile.id}. Skipping this profile for migration.`
        );
        continue;
      }
      if (IMAGE_MIME_TYPES.includes(fileType.mime) === false) {
        console.error(
          `File type ${fileType.mime} not allowed for background image for profile with id ${oldProfile.id}. Skipping this profile for migration.`
        );
        continue;
      }
      metaDataByPath.set(oldProfile.background, {
        path: oldProfile.background,
        filename: `background.${fileType.ext}`,
        extension: fileType.ext,
        sizeInMB: Math.round((blob.size / 1000 / 1000) * 100) / 100,
        mimeType: fileType.mime,
      });
    }

    if (oldProfile.avatar !== null) {
      const { error, data: blob } = await authClient.storage
        .from("images")
        .download(oldProfile.avatar);
      if (error !== null || blob === null) {
        console.error(
          `Could not retrieve avatar image for profile with id ${oldProfile.id}. Skipping this profile for migration. Error: ${error}`
        );
        continue;
      }
      const fileType = await fileTypeFromBlob(blob);
      if (typeof fileType === "undefined") {
        console.error(
          `Could not determine file type for avatar image for profile with id ${oldProfile.id}. Skipping this profile for migration.`
        );
        continue;
      }
      if (IMAGE_MIME_TYPES.includes(fileType.mime) === false) {
        console.error(
          `File type ${fileType.mime} not allowed for avatar image for profile with id ${oldProfile.id}. Skipping this profile for migration.`
        );
        continue;
      }
      metaDataByPath.set(oldProfile.avatar, {
        path: oldProfile.avatar,
        filename: `avatar.${fileType.ext}`,
        extension: fileType.ext,
        sizeInMB: Math.round((blob.size / 1000 / 1000) * 100) / 100,
        mimeType: fileType.mime,
      });
    }
  }

  for (const oldOrganization of changes.old.organizations) {
    if (oldOrganization.background !== null) {
      const { error, data: blob } = await authClient.storage
        .from("images")
        .download(oldOrganization.background);
      if (error !== null || blob === null) {
        console.error(
          `Could not retrieve background image for organization with id ${oldOrganization.id}. Skipping this organization for migration. Error: ${error}`
        );
        continue;
      }
      const fileType = await fileTypeFromBlob(blob);
      if (typeof fileType === "undefined") {
        console.error(
          `Could not determine file type for background image for organization with id ${oldOrganization.id}. Skipping this organization for migration.`
        );
        continue;
      }
      if (IMAGE_MIME_TYPES.includes(fileType.mime) === false) {
        console.error(
          `File type ${fileType.mime} not allowed for background image for organization with id ${oldOrganization.id}. Skipping this organization for migration.`
        );
        continue;
      }
      metaDataByPath.set(oldOrganization.background, {
        path: oldOrganization.background,
        filename: `background.${fileType.ext}`,
        extension: fileType.ext,
        sizeInMB: Math.round((blob.size / 1000 / 1000) * 100) / 100,
        mimeType: fileType.mime,
      });
    }

    if (oldOrganization.logo !== null) {
      const { error, data: blob } = await authClient.storage
        .from("images")
        .download(oldOrganization.logo);
      if (error !== null || blob === null) {
        console.error(
          `Could not retrieve logo image for organization with id ${oldOrganization.id}. Skipping this organization for migration. Error: ${error}`
        );
        continue;
      }
      const fileType = await fileTypeFromBlob(blob);
      if (typeof fileType === "undefined") {
        console.error(
          `Could not determine file type for logo image for organization with id ${oldOrganization.id}. Skipping this organization for migration.`
        );
        continue;
      }
      if (IMAGE_MIME_TYPES.includes(fileType.mime) === false) {
        console.error(
          `File type ${fileType.mime} not allowed for logo image for organization with id ${oldOrganization.id}. Skipping this organization for migration.`
        );
        continue;
      }
      metaDataByPath.set(oldOrganization.logo, {
        path: oldOrganization.logo,
        filename: `logo.${fileType.ext}`,
        extension: fileType.ext,
        sizeInMB: Math.round((blob.size / 1000 / 1000) * 100) / 100,
        mimeType: fileType.mime,
      });
    }
  }

  for (const oldEvent of changes.old.events) {
    if (oldEvent.background !== null) {
      const { error, data: blob } = await authClient.storage
        .from("images")
        .download(oldEvent.background);
      if (error !== null || blob === null) {
        console.error(
          `Could not retrieve background image for event with id ${oldEvent.id}. Skipping this event for migration. Error: ${error}`
        );
        continue;
      }
      const fileType = await fileTypeFromBlob(blob);
      if (typeof fileType === "undefined") {
        console.error(
          `Could not determine file type for background image for event with id ${oldEvent.id}. Skipping this event for migration.`
        );
        continue;
      }
      if (IMAGE_MIME_TYPES.includes(fileType.mime) === false) {
        console.error(
          `File type ${fileType.mime} not allowed for background image for event with id ${oldEvent.id}. Skipping this event for migration.`
        );
        continue;
      }
      metaDataByPath.set(oldEvent.background, {
        path: oldEvent.background,
        filename: `background.${fileType.ext}`,
        extension: fileType.ext,
        sizeInMB: Math.round((blob.size / 1000 / 1000) * 100) / 100,
        mimeType: fileType.mime,
      });
    }
  }

  for (const oldProject of changes.old.projects) {
    if (oldProject.background !== null) {
      const { error, data: blob } = await authClient.storage
        .from("images")
        .download(oldProject.background);
      if (error !== null || blob === null) {
        console.error(
          `Could not retrieve background image for project with id ${oldProject.id}. Skipping this project for migration. Error: ${error}`
        );
        continue;
      }
      const fileType = await fileTypeFromBlob(blob);
      if (typeof fileType === "undefined") {
        console.error(
          `Could not determine file type for background image for project with id ${oldProject.id}. Skipping this project for migration.`
        );
        continue;
      }
      if (IMAGE_MIME_TYPES.includes(fileType.mime) === false) {
        console.error(
          `File type ${fileType.mime} not allowed for background image for project with id ${oldProject.id}. Skipping this project for migration.`
        );
        continue;
      }
      metaDataByPath.set(oldProject.background, {
        path: oldProject.background,
        filename: `background.${fileType.ext}`,
        extension: fileType.ext,
        sizeInMB: Math.round((blob.size / 1000 / 1000) * 100) / 100,
        mimeType: fileType.mime,
      });
    }

    if (oldProject.logo !== null) {
      const { error, data: blob } = await authClient.storage
        .from("images")
        .download(oldProject.logo);
      if (error !== null || blob === null) {
        console.error(
          `Could not retrieve logo image for project with id ${oldProject.id}. Skipping this project for migration. Error: ${error}`
        );
        continue;
      }
      const fileType = await fileTypeFromBlob(blob);
      if (typeof fileType === "undefined") {
        console.error(
          `Could not determine file type for logo image for project with id ${oldProject.id}. Skipping this project for migration.`
        );
        continue;
      }
      if (IMAGE_MIME_TYPES.includes(fileType.mime) === false) {
        console.error(
          `File type ${fileType.mime} not allowed for logo image for project with id ${oldProject.id}. Skipping this project for migration.`
        );
        continue;
      }
      metaDataByPath.set(oldProject.logo, {
        path: oldProject.logo,
        filename: `logo.${fileType.ext}`,
        extension: fileType.ext,
        sizeInMB: Math.round((blob.size / 1000 / 1000) * 100) / 100,
        mimeType: fileType.mime,
      });
    }
  }

  console.log("Calculating changes");

  for (const oldProfile of changes.old.profiles) {
    const backgroundMetaData =
      oldProfile.background !== null
        ? metaDataByPath.get(oldProfile.background)
        : undefined;
    const avatarMetaData =
      oldProfile.avatar !== null
        ? metaDataByPath.get(oldProfile.avatar)
        : undefined;
    const newProfile = {
      ...oldProfile,
      background:
        oldProfile.background !== null &&
        typeof backgroundMetaData === "undefined"
          ? oldProfile.background
          : null,
      avatar:
        oldProfile.avatar !== null && typeof avatarMetaData === "undefined"
          ? oldProfile.avatar
          : null,
      backgroundImage:
        typeof backgroundMetaData !== "undefined"
          ? {
              create: backgroundMetaData,
            }
          : undefined,
      avatarImage:
        typeof avatarMetaData !== "undefined"
          ? {
              create: avatarMetaData,
            }
          : undefined,
    };
    changes.new.profiles.push(newProfile);
  }

  for (const oldOrganization of changes.old.organizations) {
    const backgroundMetaData =
      oldOrganization.background !== null
        ? metaDataByPath.get(oldOrganization.background)
        : undefined;
    const logoMetaData =
      oldOrganization.logo !== null
        ? metaDataByPath.get(oldOrganization.logo)
        : undefined;
    const newOrganization = {
      ...oldOrganization,
      background:
        oldOrganization.background !== null &&
        typeof backgroundMetaData === "undefined"
          ? oldOrganization.background
          : null,
      logo:
        oldOrganization.logo !== null && typeof logoMetaData === "undefined"
          ? oldOrganization.logo
          : null,
      backgroundImage:
        typeof backgroundMetaData !== "undefined"
          ? {
              create: backgroundMetaData,
            }
          : undefined,
      logoImage:
        typeof logoMetaData !== "undefined"
          ? {
              create: logoMetaData,
            }
          : undefined,
    };
    changes.new.organizations.push(newOrganization);
  }

  for (const oldProject of changes.old.projects) {
    const backgroundMetaData =
      oldProject.background !== null
        ? metaDataByPath.get(oldProject.background)
        : undefined;
    const logoMetaData =
      oldProject.logo !== null
        ? metaDataByPath.get(oldProject.logo)
        : undefined;
    const newProject = {
      ...oldProject,
      background:
        oldProject.background !== null &&
        typeof backgroundMetaData === "undefined"
          ? oldProject.background
          : null,
      logo:
        oldProject.logo !== null && typeof logoMetaData === "undefined"
          ? oldProject.logo
          : null,
      backgroundImage:
        typeof backgroundMetaData !== "undefined"
          ? {
              create: backgroundMetaData,
            }
          : undefined,
      logoImage:
        typeof logoMetaData !== "undefined"
          ? {
              create: logoMetaData,
            }
          : undefined,
    };
    changes.new.projects.push(newProject);
  }

  for (const oldEvent of changes.old.events) {
    const backgroundMetaData =
      oldEvent.background !== null
        ? metaDataByPath.get(oldEvent.background)
        : undefined;
    const newEvent = {
      ...oldEvent,
      background:
        oldEvent.background !== null &&
        typeof backgroundMetaData === "undefined"
          ? oldEvent.background
          : null,
      backgroundImage:
        typeof backgroundMetaData !== "undefined"
          ? {
              create: backgroundMetaData,
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
