import { prismaClient } from "~/prisma.server";

export async function getAdministeredOrganizations(profileId: string) {
  return await prismaClient.organization.findMany({
    where: {
      admins: {
        some: {
          profileId,
        },
      },
    },
    select: {
      id: true, // For index performance reasons ;)
      name: true,
      admins: {
        select: {
          profileId: true,
        },
      },
    },
  });
}

export async function getAdministeredEvents(profileId: string) {
  return await prismaClient.event.findMany({
    where: {
      admins: {
        some: {
          profileId,
        },
      },
    },
    select: {
      id: true, // For index performance reasons ;)
      name: true,
      admins: {
        select: {
          profileId: true,
        },
      },
    },
  });
}

export async function getAdministeredProjects(profileId: string) {
  return await prismaClient.project.findMany({
    where: {
      admins: {
        some: {
          profileId,
        },
      },
    },
    select: {
      id: true, // For index performance reasons ;)
      name: true,
      admins: {
        select: {
          profileId: true,
        },
      },
    },
  });
}
