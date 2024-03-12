import { prismaClient } from "~/prisma.server";
import { type GetProfilesSchema } from "./profiles";
import { invariantResponse } from "~/lib/utils/response";

export function getPaginationOptions(page: GetProfilesSchema["page"] = 1) {
  // TODO: Set back to 12
  const itemsPerPage = 4;
  const skip = itemsPerPage * (page - 1);
  // const take = itemsPerPage;
  // TODO: take without skip -> Alternative to fetcher
  const take = itemsPerPage * page;
  return {
    page,
    itemsPerPage,
    skip,
    take,
  };
}

export async function getVisibilityFilteredProfilesCount(options: {
  filter: NonNullable<GetProfilesSchema["filter"]>;
}) {
  const whereClauses = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const visibilityWhereStatement = {
      profileVisibility: {
        [`${typedFilterKey}s`]: false,
      },
    };
    whereClauses.push(visibilityWhereStatement);

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

  const count = await prismaClient.profile.count({
    where: {
      AND: whereClauses,
    },
  });

  return count;
}
// TODO: take without skip -> Alternative to fetcher
export async function getProfilesCount(options: {
  filter: GetProfilesSchema["filter"];
}) {
  const whereClauses = [];
  if (options.filter !== undefined) {
    for (const filterKey in options.filter) {
      const typedFilterKey = filterKey as keyof typeof options.filter;
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

  const count = await prismaClient.profile.count({
    where: {
      AND: whereClauses,
    },
  });

  return count;
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
    // TODO: take without skip -> Alternative to fetcher
    // skip: options.pagination.skip,
    take: options.pagination.take,
  });

  return profiles;
}

export async function getProfileFilterVector(options: {
  filter: GetProfilesSchema["filter"];
}) {
  let whereClause = "";
  const whereStatements = [];
  console.log(options.filter);
  if (options.filter !== undefined) {
    for (const filterKey in options.filter) {
      const typedFilterKey = filterKey as keyof typeof options.filter;
      // TODO: Union type issue when we add another filter key. Reason is shown below. The select statement can have different signatures because of the relations.
      const allFilterValues = await prismaClient[typedFilterKey].findMany({
        select: {
          slug: true,
        },
      });
      // const test = await prismaClient.offer.findMany({
      //   select: {
      //     slug: true,
      //     OffersOnProfiles: {
      //       select: {
      //         offerId: true,
      //       }
      //     }
      //   },
      // });
      // const test2 = await prismaClient.focus.findMany({
      //   select: {
      //     slug: true,
      //     organizations: {
      //       select: {
      //         organizationId: true
      //       }
      //     }
      //   },
      // });
      for (const slug of options.filter[typedFilterKey]) {
        // Validate slug because of queryRawUnsafe
        invariantResponse(
          allFilterValues.some((value) => {
            return value.slug === slug;
          }),
          "Cannot filter by the specified slug.",
          { status: 400 }
        );
        const tuple = `${typedFilterKey}\\:${slug}`;
        const whereStatement = `filter_vector @@ '${tuple}'::tsquery`;
        whereStatements.push(whereStatement);
      }
    }
  }

  if (whereStatements.length > 0) {
    whereClause = `WHERE ${whereStatements.join(" AND ")}`;
  }

  const filterVector: {
    attr: keyof NonNullable<typeof options.filter>;
    value: string[];
    count: number[];
  }[] = await prismaClient.$queryRawUnsafe(`
  SELECT
    split_part(word, ':', 1) AS attr,
    array_agg(split_part(word, ':', 2)) AS value,
    array_agg(ndoc) AS count
  FROM ts_stat($$
    SELECT filter_vector
    FROM profiles
    ${whereClause}
  $$)
  GROUP BY attr;
  `);

  return filterVector;
}
