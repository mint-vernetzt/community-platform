import { prismaClient } from "~/prisma.server";

export async function getProjectBySlug(slug: string) {
  return await prismaClient.project.findUnique({
    select: {
      id: true,
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              logo: true,
              slug: true,
              name: true,
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
          },
        },
      },
    },
    where: {
      slug,
    },
  });
}

export function getResponsibleOrganizationDataFromProject(
  project: NonNullable<Awaited<ReturnType<typeof getProjectBySlug>>>
) {
  const organizationData = project.responsibleOrganizations.map((item) => {
    return item.organization;
  });
  return organizationData;
}

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
