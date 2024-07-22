import { json } from "@remix-run/server-runtime";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma.server";
import { type GetOrganizationsSchema } from "./organizations";

export function getTakeParam(page: GetOrganizationsSchema["page"]) {
  const itemsPerPage = 12;
  const take = itemsPerPage * page;
  return take;
}

export async function getVisibilityFilteredOrganizationsCount(options: {
  filter: GetOrganizationsSchema["filter"];
}) {
  const whereClauses = [];
  const visibilityWhereClauses = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }
    const visibilityWhereStatement = {
      organizationVisibility: {
        [`${typedFilterKey}${typedFilterKey === "focus" ? "es" : "s"}`]: false,
      },
    };
    visibilityWhereClauses.push(visibilityWhereStatement);

    for (const slug of filterValues) {
      const filterWhereStatement = {
        [`${typedFilterKey}${typedFilterKey === "focus" ? "es" : "s"}`]: {
          some: {
            [`${
              typedFilterKey === "type" ? "organizationType" : typedFilterKey
            }`]: {
              slug,
            },
          },
        },
      };
      whereClauses.push(filterWhereStatement);
    }
  }
  if (visibilityWhereClauses.length === 0) {
    return 0;
  }
  whereClauses.push({ OR: [...visibilityWhereClauses] });

  const count = await prismaClient.organization.count({
    where: {
      AND: whereClauses,
    },
  });

  return count;
}

export async function getOrganizationsCount(options: {
  filter: GetOrganizationsSchema["filter"];
}) {
  const whereClauses = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];
    for (const slug of filterValues) {
      const filterWhereStatement = {
        [`${typedFilterKey}${typedFilterKey === "focus" ? "es" : "s"}`]: {
          some: {
            [`${
              typedFilterKey === "type" ? "organizationType" : typedFilterKey
            }`]: {
              slug,
            },
          },
        },
      };
      whereClauses.push(filterWhereStatement);
    }
  }

  const count = await prismaClient.organization.count({
    where: {
      AND: whereClauses,
    },
  });

  return count;
}

export async function getAllOrganizations(options: {
  filter: GetOrganizationsSchema["filter"];
  sortBy: GetOrganizationsSchema["sortBy"];
  take: ReturnType<typeof getTakeParam>;
  isLoggedIn: boolean;
}) {
  const whereClauses = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }
    if (options.isLoggedIn === false) {
      const visibilityWhereStatement = {
        organizationVisibility: {
          [`${typedFilterKey}${typedFilterKey === "focus" ? "es" : "s"}`]: true,
        },
      };
      whereClauses.push(visibilityWhereStatement);
    }
    for (const slug of filterValues) {
      const filterWhereStatement = {
        [`${typedFilterKey}${typedFilterKey === "focus" ? "es" : "s"}`]: {
          some: {
            [`${
              typedFilterKey === "type" ? "organizationType" : typedFilterKey
            }`]: {
              slug,
            },
          },
        },
      };
      whereClauses.push(filterWhereStatement);
    }
  }

  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      logo: true,
      background: true,
      types: {
        select: {
          organizationType: {
            select: {
              title: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              title: true,
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
              avatar: true,
              username: true,
              id: true,
              profileVisibility: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
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
          bio: true,
          logo: true,
          background: true,
          types: true,
          focuses: true,
          areas: true,
          teamMembers: true,
        },
      },
    },
    where: {
      AND: whereClauses,
    },
    orderBy: [
      {
        [options.sortBy.value]: options.sortBy.direction,
      },
      {
        id: "asc",
      },
    ],
    take: options.take,
  });

  return organizations;
}

export async function getOrganizationFilterVector(options: {
  filter: GetOrganizationsSchema["filter"];
}) {
  let whereClause = "";
  const whereStatements = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }
    // TODO: Union type issue when we add another filter key. Reason is shown below. The select statement can have different signatures because of the relations.
    /* Example:
        const test = await prismaClient.organizationType.findMany({
          select: {
            slug: true,
            organizations: {
              select: {
                organizationId: true,
              },
            },
          },
        });
        const test2 = await prismaClient.area.findMany({
          select: {
            slug: true,
            AreasOnOrganizations: {
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

    // I worked arround with an assertion. But if any table except organizationTypes remove their slug, this will break and typescript will not warn us.
    const fakeTypedFilterKey = filterKey as "organizationType";
    let allPossibleFilterValues;
    try {
      allPossibleFilterValues = await prismaClient[
        `${typedFilterKey === "type" ? "organizationType" : fakeTypedFilterKey}`
      ].findMany({
        select: {
          slug: true,
        },
      });
    } catch (error: any) {
      throw json({ message: "Server error" }, { status: 500 });
    }

    for (const slug of filterValues) {
      // Validate slug because of queryRawUnsafe
      invariantResponse(
        allPossibleFilterValues.some((value) => {
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

  if (whereStatements.length > 0) {
    whereClause = `WHERE ${whereStatements.join(" AND ")}`;
  }

  const filterVector: {
    attr: keyof typeof options.filter;
    value: string[];
    count: number[];
  }[] = await prismaClient.$queryRawUnsafe(`
    SELECT
      split_part(word, ':', 1) AS attr,
      array_agg(split_part(word, ':', 2)) AS value,
      array_agg(ndoc) AS count
    FROM ts_stat($$
      SELECT filter_vector
      FROM organizations
      ${whereClause}
    $$)
    GROUP BY attr;
    `);

  return filterVector;
}

export function getFilterCountForSlug(
  // TODO: Remove '| null' when slug isn't optional anymore (after migration)
  slug: string | null,
  filterVector: Awaited<ReturnType<typeof getOrganizationFilterVector>>,
  attribute: ArrayElement<
    Awaited<ReturnType<typeof getOrganizationFilterVector>>
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

export async function getAllOrganizationTypes() {
  return await prismaClient.organizationType.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
    },
  });
}

export async function getAllFocuses() {
  return await prismaClient.focus.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
    },
  });
}
