import { prismaClient } from "~/prisma.server";
import { type GetProfilesSchema } from "./profiles";
import { Prisma } from "@prisma/client";

export function getPaginationOptions(page: GetProfilesSchema["page"] = 1) {
  const itemsPerPage = 12;
  const skip = itemsPerPage * (page - 1);
  const take = itemsPerPage;
  return {
    page,
    itemsPerPage,
    skip,
    take,
  };
}

export async function getAllProfiles(options: {
  pagination: ReturnType<typeof getPaginationOptions>;
  filter: GetProfilesSchema["filter"];
  sortBy: GetProfilesSchema["sortBy"];
  isLoggedIn: boolean;
}) {
  const whereClauses = [];
  if (options.filter !== undefined) {
    for (const filterKey in options.filter) {
      const typedFilterKey = filterKey as keyof typeof options.filter;
      if (options.isLoggedIn === false) {
        const visibilityWhereStatement = {
          profileVisibility: {
            [`${typedFilterKey}s`]: true,
          },
        };
        whereClauses.push(visibilityWhereStatement);
      }
      for (const slug of options.filter[typedFilterKey]) {
        const filterWhereStatement = {
          [`${typedFilterKey}s`]: {
            some: {
              [typedFilterKey]: {
                slug,
              },
            },
          },
        };
        whereClauses.push(filterWhereStatement);
      }
    }
  }

  const profiles = await prismaClient.profile.findMany({
    select: {
      id: true,
      academicTitle: true,
      username: true,
      firstName: true,
      lastName: true,
      position: true,
      avatar: true,
      background: true,
      memberOf: {
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              organizationVisibility: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logo: true,
                },
              },
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
      offers: {
        select: {
          offer: {
            select: {
              title: true,
            },
          },
        },
      },
      profileVisibility: {
        select: {
          id: true,
          academicTitle: true,
          username: true,
          firstName: true,
          lastName: true,
          position: true,
          avatar: true,
          background: true,
          memberOf: true,
          areas: true,
          offers: true,
        },
      },
    },
    where: {
      AND: whereClauses,
    },
    orderBy:
      options.sortBy !== undefined
        ? {
            [options.sortBy.value]: options.sortBy.direction,
          }
        : {
            firstName: "asc",
          },
    skip: options.pagination.skip,
    take: options.pagination.take,
  });

  return profiles;
}

export async function getProfileFilterVector(options: {
  filter: GetProfilesSchema["filter"];
}) {
  let whereClause = Prisma.empty;
  const whereStatements = [];
  if (options.filter !== undefined) {
    for (const filterKey in options.filter) {
      const typedFilterKey = filterKey as keyof typeof options.filter;
      for (const slug of options.filter[typedFilterKey]) {
        const tuple = `'${typedFilterKey}:${slug}'`;
        const whereStatement = Prisma.sql`filter_vector @@ ${tuple}::tsquery`;
        whereStatements.push(whereStatement);
      }
    }
  }

  if (whereStatements.length > 0) {
    whereClause = Prisma.join(whereStatements, ") AND (", "WHERE (", ")");
  }

  console.log("\n", whereClause.sql, "\n");

  const filterVector = await prismaClient.$queryRaw`
  SELECT
    split_part(word, ':', 1) AS attr,
    split_part(word, ':', 2) AS value,
    ndoc AS count
  FROM ts_stat($$
    SELECT filter_vector FROM projects
    ${whereClause}		 
  $$);`;
  // ORDER BY attr, value;`;

  return filterVector;
}
