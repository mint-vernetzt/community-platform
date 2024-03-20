import { json } from "@remix-run/server-runtime";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma.server";
import { type GetProfilesSchema } from "./profiles";

export function getTakeParam(page: GetProfilesSchema["page"] = 1) {
  const itemsPerPage = 12;
  const take = itemsPerPage * page;
  return take;
}

export async function getVisibilityFilteredProfilesCount(options: {
  filter: NonNullable<GetProfilesSchema["filter"]>;
}) {
  const whereClauses = [];
  const visibilityWhereClauses = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const visibilityWhereStatement = {
      profileVisibility: {
        [`${typedFilterKey}s`]: false,
      },
    };
    visibilityWhereClauses.push(visibilityWhereStatement);

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
  whereClauses.push({ OR: [...visibilityWhereClauses] });

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
      // TODO: Union type issue when we add another filter key. Reason is shown below. The select statement can have different signatures because of the relations.
      /* Example:
      const test = await prismaClient.offer.findMany({
        select: {
          slug: true,
          OffersOnProfiles: {
            select: {
              offerId: true,
            },
          },
        },
      });
      const test2 = await prismaClient.area.findMany({
        select: {
          slug: true,
          AreasOnProfiles: {
            select: {
              areaId: true,
            },
          },
        },
      });
       */
      // Further reading:
      // https://www.prisma.io/docs/orm/prisma-schema/data-model/table-inheritance#union-types
      // https://github.com/prisma/prisma/issues/2505

      // I worked arround with an assertion. But if any table except areas remove their slug, this will break and typescript will not warn us.
      const fakeTypedFilterKey = filterKey as "area";
      let allFilterValues;
      try {
        allFilterValues = await prismaClient[fakeTypedFilterKey].findMany({
          select: {
            slug: true,
          },
        });
      } catch (error: any) {
        throw json({ message: "Server error" }, { status: 500 });
      }

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

export function getFilterCountForSlug(
  // TODO: Remove '| null' when slug isn't optional anymore (after migration)
  slug: string | null,
  filterVector: Awaited<ReturnType<typeof getProfileFilterVector>>,
  attribute: ArrayElement<
    Awaited<ReturnType<typeof getProfileFilterVector>>
  >["attr"]
) {
  const filterKeyVector = filterVector.find((vector) => {
    return vector.attr === attribute;
  });

  if (typeof filterKeyVector === "undefined") {
    return 0;
  }

  // TODO: Remove '|| ""' when slug isn't optional anymore (after migration)
  const valueIndex = filterKeyVector.value.indexOf(slug || "");
  if (valueIndex === -1) {
    return 0;
  }

  const filterCount = filterKeyVector.count[valueIndex];

  return filterCount;
}

export async function getAllOffers() {
  return await prismaClient.offer.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });
}
