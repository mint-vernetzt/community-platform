import { prismaClient } from "~/prisma.server";

export async function getProjectBySlug(slug: string) {
  const result = await prismaClient.project.findFirst({
    where: { slug },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      street: true,
      streetNumber: true,
      zipCode: true,
      city: true,
      headline: true,
      excerpt: true,
      description: true,
      website: true,
      linkedin: true,
      twitter: true,
      xing: true,
      facebook: true,
      youtube: true,
      instagram: true,
      targetGroups: {
        select: {
          targetGroupId: true,
          targetGroup: {
            select: {
              title: true,
            },
          },
        },
      },
      disciplines: {
        select: {
          disciplineId: true,
          discipline: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });
  return result;
}

export async function getProjectBySlugForAction(slug: string) {
  return await prismaClient.project.findUnique({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
}
