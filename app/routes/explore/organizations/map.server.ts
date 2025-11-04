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
      logo: true,
      longitude: true,
      latitude: true,
      street: true,
      city: true,
      zipCode: true,
      addressSupplement: true,
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
      networkMembers: {
        select: {
          networkMember: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              organizationVisibility: {
                select: {
                  id: true,
                  slug: true,
                  logo: true,
                  name: true,
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
          logo: true,
          longitude: true,
          latitude: true,
          street: true,
          city: true,
          zipCode: true,
          types: true,
          networkTypes: true,
          networkMembers: true,
        },
      },
    },
    where: {
      id: {
        in: organizationIds,
      },
      longitude: {
        not: null,
      },
      latitude: {
        not: null,
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
