import { prismaClient } from "~/prisma.server";

export async function getProfileById(id: string) {
  const profile = await prismaClient.profile.findFirst({
    where: {
      id,
    },
    select: {
      username: true,
    },
  });
  return profile;
}

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
      name: true,
      childEvents: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function getEventBySlugForAction(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      name: true,
    },
    where: {
      slug,
    },
  });
}
