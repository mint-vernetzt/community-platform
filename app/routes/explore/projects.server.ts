import { type supportedCookieLanguages } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { type GetProjectsSchema } from "./projects";

export type ExploreProjectsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["explore/projects"];

export function getTakeParam(page: GetProjectsSchema["page"]) {
  const itemsPerPage = 12;
  const take = itemsPerPage * page;
  return take;
}

type ProjectVisibility = { projectVisibility: { [x: string]: boolean } };
type FilterKeyWhereStatement = {
  OR: { [x: string]: { some: { [x: string]: { slug: string } } } }[];
};
type WhereClause = {
  AND: ProjectVisibility[] & FilterKeyWhereStatement[];
};

export async function getVisibilityFilteredProjectsCount(options: {
  filter: GetProjectsSchema["filter"];
}) {
  const whereClauses: {
    AND: WhereClause["AND"] & { OR: ProjectVisibility[] }[];
  } = { AND: [] };
  const visibilityWhereClauses: { OR: ProjectVisibility[] } = { OR: [] };
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];

    if (filterValues.length === 0) {
      continue;
    }
    const filterKeyWhereStatement: FilterKeyWhereStatement = { OR: [] };

    const visibilityWhereStatement = {
      projectVisibility: {
        [`${typedFilterKey}s`]: false,
      },
    };
    visibilityWhereClauses.OR.push(visibilityWhereStatement);

    for (const slug of filterValues) {
      const filterWhereStatement = {
        [`${typedFilterKey}s`]: {
          some: {
            [typedFilterKey]: {
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

  const count = await prismaClient.project.count({
    where: {
      AND: [...whereClauses.AND, { published: true }],
    },
  });

  console.log("\ngetVisibilityFilteredProjectsCount");

  console.log(
    JSON.stringify(
      {
        where: {
          AND: [...whereClauses.AND, { published: true }],
        },
      },
      null,
      2
    )
  );

  return count;
}

export async function getProjectsCount(options: {
  filter: GetProjectsSchema["filter"];
}) {
  const whereClauses: WhereClause = { AND: [] };
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];

    if (filterValues.length === 0) {
      continue;
    }

    const filterKeyWhereStatement: FilterKeyWhereStatement = { OR: [] };

    for (const slug of filterValues) {
      const filterWhereStatement = {
        [`${typedFilterKey}s`]: {
          some: {
            [typedFilterKey]: {
              slug,
            },
          },
        },
      };

      filterKeyWhereStatement.OR.push(filterWhereStatement);
    }

    whereClauses.AND.push(filterKeyWhereStatement);
  }

  const count = await prismaClient.project.count({
    where: {
      AND: [...whereClauses.AND, { published: true }],
    },
  });

  return count;
}

export async function getAllProjects(options: {
  filter: GetProjectsSchema["filter"];
  sortBy: GetProjectsSchema["sortBy"];
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
        projectVisibility: {
          [`${typedFilterKey}s`]: true,
        },
      };
      whereClauses.AND.push(visibilityWhereStatement);
    }

    const filterKeyWhereStatement: FilterKeyWhereStatement = { OR: [] };

    for (const slug of filterValues) {
      const filterWhereStatement = {
        [`${typedFilterKey}s`]: {
          some: {
            [typedFilterKey]: {
              slug,
            },
          },
        },
      };
      filterKeyWhereStatement.OR.push(filterWhereStatement);
    }

    whereClauses.AND.push(filterKeyWhereStatement);
  }

  const projects = await prismaClient.project.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      background: true,
      excerpt: true,
      subline: true,
      responsibleOrganizations: {
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
      projectVisibility: {
        select: {
          id: true,
          slug: true,
          name: true,
          logo: true,
          background: true,
          excerpt: true,
          subline: true,
          responsibleOrganizations: true,
        },
      },
    },
    where: {
      AND: [...whereClauses.AND, { published: true }],
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

  return projects;
}

export async function getProjectFilterVectorForAttribute(
  attribute: keyof GetProjectsSchema["filter"],
  filter: GetProjectsSchema["filter"]
) {
  let whereClause = "";
  const whereStatements = ["published = true"];
  for (const filterKey in filter) {
    const typedFilterKey = filterKey as keyof typeof filter;
    if (typedFilterKey === attribute) {
      continue;
    }
    const filterValues = filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }
    // TODO: Union type issue when we add another filter key. Reason is shown below. The select statement can have different signatures because of the relations.
    /* Example:
    const test = await prismaClient.projectTargetGroup.findMany({
      select: {
        slug: true,
        projects: {
          select: {
            projectId: true,
          },
        },
      },
    });
    const test2 = await prismaClient.area.findMany({
      select: {
        slug: true,
        AreasOnProjects: {
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

    // I worked arround with an assertion. But if any table except area remove their slug, this will break and typescript will not warn us.
    const fakeTypedFilterKey = filterKey as "area";
    let allPossibleFilterValues;
    try {
      allPossibleFilterValues = await prismaClient[fakeTypedFilterKey].findMany(
        {
          select: {
            slug: true,
          },
        }
      );
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
      FROM projects
      ${whereClause}
    $$)
    GROUP BY attr;
    `);

  return filterVector;
}

export function getFilterCountForSlug(
  // TODO: Remove '| null' when slug isn't optional anymore (after migration)
  slug: string | null,
  filterVector: Awaited<ReturnType<typeof getProjectFilterVectorForAttribute>>,
  attribute: ArrayElement<
    Awaited<ReturnType<typeof getProjectFilterVectorForAttribute>>
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

export async function getAllDisciplines() {
  return await prismaClient.discipline.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      slug: true,
    },
  });
}

export async function getAllAdditionalDisciplines() {
  return await prismaClient.additionalDiscipline.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      slug: true,
    },
  });
}

export async function getAllProjectTargetGroups() {
  return await prismaClient.projectTargetGroup.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      slug: true,
    },
  });
}

export async function getAllFormats() {
  return await prismaClient.format.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      slug: true,
    },
  });
}

export async function getAllSpecialTargetGroups() {
  return await prismaClient.specialTargetGroup.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      slug: true,
    },
  });
}

export async function getAllFinancings() {
  return await prismaClient.financing.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      slug: true,
    },
  });
}
