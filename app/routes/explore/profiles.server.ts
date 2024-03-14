import { type Area, type Prisma } from "@prisma/client";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { type GetProfilesSchema } from "./profiles";
import { ArrayElement } from "~/lib/utils/types";

export function getTakeParam(page: GetProfilesSchema["page"] = 1) {
  const itemsPerPage = 12;
  const take = itemsPerPage * page;
  return take;
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

    if (typedFilterKey === "area" && options.filter.area !== undefined) {
      const filterWhereStatement = {
        areas: {
          some: {
            area: {
              slug: options.filter.area,
            },
          },
        },
      };
      whereClauses.push(filterWhereStatement);
    }
    if (typedFilterKey !== "area") {
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

export async function getProfilesCount(options: {
  filter: GetProfilesSchema["filter"];
}) {
  const whereClauses = [];
  if (options.filter !== undefined) {
    for (const filterKey in options.filter) {
      const typedFilterKey = filterKey as keyof typeof options.filter;
      if (typedFilterKey === "area" && options.filter.area !== undefined) {
        const filterWhereStatement = {
          areas: {
            some: {
              area: {
                slug: options.filter.area,
              },
            },
          },
        };
        whereClauses.push(filterWhereStatement);
      }
      if (typedFilterKey !== "area") {
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
  }

  const count = await prismaClient.profile.count({
    where: {
      AND: whereClauses,
    },
  });

  return count;
}

export async function getAllProfiles(options: {
  filter: GetProfilesSchema["filter"];
  sortBy: GetProfilesSchema["sortBy"];
  take: ReturnType<typeof getTakeParam>;
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
      if (typedFilterKey === "area" && options.filter.area !== undefined) {
        const filterWhereStatement = {
          areas: {
            some: {
              area: {
                slug: options.filter.area,
              },
            },
          },
        };
        whereClauses.push(filterWhereStatement);
      }
      if (typedFilterKey !== "area") {
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
    take: options.take,
  });

  return profiles;
}

export async function getProfileFilterVector(options: {
  filter: GetProfilesSchema["filter"];
}) {
  let whereClause = "";
  const whereStatements = [];
  if (options.filter !== undefined) {
    for (const filterKey in options.filter) {
      const typedFilterKey = filterKey as keyof typeof options.filter;
      // TODO: remove this when areas are added to ts-vector
      // if (typedFilterKey !== "area") {
      // TODO: Union type issue when we add another filter key. Reason is shown below. The select statement can have different signatures because of the relations.
      // @ts-ignore
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
      // const test2 = await prismaClient.area.findMany({
      //   select: {
      //     slug: true,
      //     AreasOnProfiles: {
      //       select: {
      //         areaId: true
      //       }
      //     }
      //   },
      // });
      if (typedFilterKey !== "area") {
        for (const slug of options.filter[typedFilterKey]) {
          // Validate slug because of queryRawUnsafe
          invariantResponse(
            // TODO: Union type issue when we add another filter key. Reason is shown below. The select statement can have different signatures because of the relations.
            // @ts-ignore
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
      } else {
        const slug = options.filter[typedFilterKey];
        // Validate slug because of queryRawUnsafe
        invariantResponse(
          // TODO: Union type issue when we add another filter key. Reason is shown below. The select statement can have different signatures because of the relations.
          // @ts-ignore
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

export async function getAreasBySearchQuery(queryString?: string) {
  const whereQueries: {
    [K in Area as string]: { contains: string; mode: Prisma.QueryMode };
  }[] = [];
  if (queryString !== undefined && queryString.length >= 3) {
    const query = queryString.split(" ");
    for (const word of query) {
      whereQueries.push({ name: { contains: word, mode: "insensitive" } });
    }
  }

  return await prismaClient.area.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
    },
    where: {
      OR: [
        ...whereQueries,
        {
          type: {
            in: ["global", "country"],
          },
        },
      ],
    },
    take: 12,
    orderBy: {
      slug: "asc",
    },
  });
}

export async function getAreaNameBySlug(slug: string) {
  const area = await prismaClient.area.findFirst({
    select: {
      id: true,
      name: true,
    },
    where: {
      slug,
    },
  });
  if (area === null) {
    return undefined;
  }
  return area.name;
}

export function getFilterCountForSlug(
  // TODO: Remove '| null' when slug isn't optional anymore (after migration)
  slug: string | null,
  filterVector: Awaited<ReturnType<typeof getProfileFilterVector>>,
  filterKey: ArrayElement<
    Awaited<ReturnType<typeof getProfileFilterVector>>
  >["attr"]
) {
  const filterKeyVector = filterVector.find((vector) => {
    return vector.attr === filterKey;
  });
  // TODO: Remove '|| ""' when slug isn't optional anymore (after migration)
  const valueIndex =
    filterKeyVector !== undefined
      ? filterKeyVector.value.indexOf(slug || "")
      : null;
  if (valueIndex === null) {
    return null;
  }
  const offerCount =
    filterKeyVector !== undefined
      ? filterKeyVector.count.at(valueIndex) || null
      : null;

  return offerCount;
}
