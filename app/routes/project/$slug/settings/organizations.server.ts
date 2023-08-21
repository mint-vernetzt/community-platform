import { prismaClient } from "~/prisma.server";

export async function getOwnOrganizationsSuggestions(
  id: string,
  alreadyResponsibleOrganizationSlugs: string[]
) {
  const ownOrganizationSuggestions = await prismaClient.organization.findMany({
    select: {
      id: true,
      logo: true,
      name: true,
      slug: true,
      types: {
        select: {
          organizationType: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    where: {
      AND: [
        {
          slug: {
            notIn: alreadyResponsibleOrganizationSlugs,
          },
        },
        {
          teamMembers: {
            some: {
              profileId: id,
            },
          },
        },
      ],
    },
  });
  return ownOrganizationSuggestions;
}
