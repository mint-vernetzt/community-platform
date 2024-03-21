import { json } from "@remix-run/server-runtime";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma.server";
import { type GetProjectsSchema } from "./projects";

export function getTakeParam(page: GetProjectsSchema["page"]) {
  const itemsPerPage = 12;
  const take = itemsPerPage * page;
  return take;
}

export async function getVisibilityFilteredProjectsCount(options: {
  filter: GetProjectsSchema["filter"];
}) {
  const whereClauses = [];
  const visibilityWhereClauses = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const visibilityWhereStatement = {
      projectVisibility: {
        [`${typedFilterKey}s`]: false,
      },
    };
    visibilityWhereClauses.push(visibilityWhereStatement);

    const filterValues = options.filter[typedFilterKey];
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
      whereClauses.push(filterWhereStatement);
    }
  }
  whereClauses.push({ OR: [...visibilityWhereClauses] });

  const count = await prismaClient.project.count({
    where: {
      AND: [...whereClauses, { published: true }],
    },
  });

  return count;
}

export async function getProjectsCount(options: {
  filter: GetProjectsSchema["filter"];
}) {
  const whereClauses = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];
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
      whereClauses.push(filterWhereStatement);
    }
  }

  const count = await prismaClient.project.count({
    where: {
      AND: [...whereClauses, { published: true }],
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
  const whereClauses = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    if (options.isLoggedIn === false) {
      const visibilityWhereStatement = {
        projectVisibility: {
          [`${typedFilterKey}s`]: true,
        },
      };
      whereClauses.push(visibilityWhereStatement);
    }
    const filterValues = options.filter[typedFilterKey];
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
      whereClauses.push(filterWhereStatement);
    }
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
      awards: {
        select: {
          award: {
            select: {
              id: true,
              title: true,
              shortTitle: true,
              date: true,
              logo: true,
            },
          },
        },
      },
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
          awards: true,
          responsibleOrganizations: true,
        },
      },
    },
    where: {
      AND: [...whereClauses, { published: true }],
    },
    orderBy: {
      [options.sortBy.value]: options.sortBy.direction,
    },
    take: options.take,
  });

  return projects;
}

export async function getProjectFilterVector(options: {
  filter: GetProjectsSchema["filter"];
}) {
  let whereClause = "";
  const whereStatements = ["published = true"];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
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
    } catch (error: any) {
      throw json({ message: "Server error" }, { status: 500 });
    }

    const filterValues = options.filter[typedFilterKey];
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
  filterVector: Awaited<ReturnType<typeof getProjectFilterVector>>,
  attribute: ArrayElement<
    Awaited<ReturnType<typeof getProjectFilterVector>>
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
      title: true,
      description: true,
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
      title: true,
      description: true,
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
      title: true,
      description: true,
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
      title: true,
      description: true,
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
      title: true,
      description: true,
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
      title: true,
      description: true,
      slug: true,
    },
  });
}
