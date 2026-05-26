import { prismaClient } from "~/prisma.server";
import { type getTakeParam } from "../organizations.server";
import { type GetOrganizationsSchema } from "../organizations.shared";

export async function getAllOrganizations(options: {
  sortBy: GetOrganizationsSchema["orgSortBy"];
  take?: ReturnType<typeof getTakeParam>;
  organizationIds: string[];
}) {
  const { sortBy, take, organizationIds } = options;

  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      logoImageMetaData: {
        select: {
          path: true,
        },
      },
      backgroundImageMetaData: {
        select: {
          path: true,
        },
      },
      types: {
        select: {
          organizationType: {
            select: {
              slug: true,
            },
          },
        },
      },
      networkTypes: {
        select: {
          networkType: {
            select: {
              slug: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              slug: true,
            },
          },
        },
      },
      areas: {
        select: {
          area: {
            select: {
              name: true,
            },
          },
        },
      },
      teamMembers: {
        select: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
              avatarImageMetaData: {
                select: {
                  path: true,
                },
              },
              username: true,
              id: true,
              profileVisibility: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarImageMetaData: true,
                  username: true,
                  id: true,
                },
              },
            },
          },
        },
      },
      organizationVisibility: {
        select: {
          id: true,
          slug: true,
          name: true,
          logoImageMetaData: true,
          backgroundImageMetaData: true,
          types: true,
          networkTypes: true,
          focuses: true,
          areas: true,
          teamMembers: true,
        },
      },
    },
    where: {
      id: {
        in: organizationIds,
      },
    },
    orderBy: [
      {
        [sortBy.split("-")[0]]: sortBy.split("-")[1],
      },
      {
        id: "asc",
      },
    ],
    take,
  });

  return organizations;
}
