import { type supportedCookieLanguages } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { type GetOrganizationsSchema } from "./organizations";

export type ExploreOrganizationsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["explore/organizations"];

export function getTakeParam(page: GetOrganizationsSchema["page"]) {
  const itemsPerPage = 12;
  const take = itemsPerPage * page;
  return take;
}

type OrganizationVisibility = {
  organizationVisibility: { [x: string]: boolean };
};
type FilterKeyWhereStatement = {
  OR: { [x: string]: { some: { [x: string]: { slug: string } } } }[];
};
type WhereClause = {
  AND: OrganizationVisibility[] & FilterKeyWhereStatement[];
};

export async function getVisibilityFilteredOrganizationsCount(options: {
  filter: GetOrganizationsSchema["filter"];
}) {
  const whereClauses: {
    AND: WhereClause["AND"] & { OR: OrganizationVisibility[] }[];
  } = { AND: [] };
  const visibilityWhereClauses: { OR: OrganizationVisibility[] } = { OR: [] };
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];

    if (filterValues.length === 0) {
      continue;
    }

    const filterKeyWhereStatement: FilterKeyWhereStatement = { OR: [] };

    const visibilityWhereStatement = {
      organizationVisibility: {
        [`${typedFilterKey}${typedFilterKey === "focus" ? "es" : "s"}`]: false,
      },
    };
    visibilityWhereClauses.OR.push(visibilityWhereStatement);

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
      filterKeyWhereStatement.OR.push(filterWhereStatement);
    }
    whereClauses.AND.push(filterKeyWhereStatement);
  }
  if (visibilityWhereClauses.OR.length === 0) {
    return 0;
  }
  whereClauses.AND.push(visibilityWhereClauses);

  const count = await prismaClient.organization.count({
    where: whereClauses,
  });

  return count;
}

export async function getOrganizationsCount(options: {
  filter: GetOrganizationsSchema["filter"];
}) {
  const whereClauses: WhereClause = { AND: [] };
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];

    const filterKeyWhereStatement: FilterKeyWhereStatement = { OR: [] };

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
      filterKeyWhereStatement.OR.push(filterWhereStatement);
    }

    whereClauses.AND.push(filterKeyWhereStatement);
  }

  const count = await prismaClient.organization.count({
    where: whereClauses,
  });

  return count;
}

export async function getAllOrganizations(options: {
  filter: GetOrganizationsSchema["filter"];
  sortBy: GetOrganizationsSchema["sortBy"];
  take: ReturnType<typeof getTakeParam>;
  isLoggedIn: boolean;
}) {
  const whereClauses: WhereClause = { AND: [] };
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
      whereClauses.AND.push(visibilityWhereStatement);
    }

    const filterKeyWhereStatement: FilterKeyWhereStatement = { OR: [] };

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
      filterKeyWhereStatement.OR.push(filterWhereStatement);
    }

    whereClauses.AND.push(filterKeyWhereStatement);
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

export async function getOrganizationFilterVectorForAttribute(
  attribute: keyof GetOrganizationsSchema["filter"],
  filter: GetOrganizationsSchema["filter"]
) {
  let whereClause = "";
  const whereStatements = [];
  for (const filterKey in filter) {
    const typedFilterKey = filterKey as keyof typeof filter;
    const filterValues = filter[typedFilterKey];

    if (typedFilterKey === attribute) {
      continue;
    }

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
      // TODO: fix type issue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error({ error });
      invariantResponse(false, "Server error", { status: 500 });
    }

    const fieldWhereStatements: string[] = [];

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
      fieldWhereStatements.push(whereStatement);
    }

    whereStatements.push(`(${fieldWhereStatements.join(" OR ")})`);
  }

  if (whereStatements.length > 0) {
    whereClause = `WHERE ${whereStatements.join(" AND ")}`;
  }

  const filterVector: {
    attr: keyof typeof filter;
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
  filterVector: Awaited<
    ReturnType<typeof getOrganizationFilterVectorForAttribute>
  >,
  attribute: ArrayElement<
    Awaited<ReturnType<typeof getOrganizationFilterVectorForAttribute>>
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
      slug: true,
    },
  });
}
