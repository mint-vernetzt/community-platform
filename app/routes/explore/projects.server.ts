import { type supportedCookieLanguages } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { type GetProjectsSchema } from "./projects";
import { type GetSearchSchema } from "./index";
import { type User } from "@supabase/supabase-js";
import { getSlugFromLocaleThatContainsWord } from "~/i18n.server";
import type { Organization, Prisma, Profile, Project } from "@prisma/client";

export type ExploreProjectsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["explore/projects"];

export function getTakeParam(page: GetProjectsSchema["prjPage"]) {
  const itemsPerPage = 12;
  const take = itemsPerPage * page;
  return take;
}

type ProjectVisibility = { projectVisibility: { [x: string]: boolean } };
type FilterKeyWhereStatement = {
  OR: { [x: string]: { some: { [x: string]: { slug: string } } } }[];
};
type SearchWhereStatement = {
  OR: {
    AND: (
      | {
          [K in Project as string]: {
            contains: string;
            mode: Prisma.QueryMode;
          };
        }
      | {
          [K in "areas"]?: {
            some: {
              [K in "area"]?: {
                [K in "name"]?: {
                  contains: string;
                  mode: Prisma.QueryMode;
                };
              };
            };
          };
        }
      | {
          [K in
            | "formats"
            | "disciplines"
            | "projectTargetGroups"
            | "specialTargetGroups"]?: {
            some: {
              [K in
                | "format"
                | "discipline"
                | "projectTargetGroup"
                | "specialTargetGroup"]?: {
                [K in "slug"]?: {
                  contains: string;
                  mode: Prisma.QueryMode;
                };
              };
            };
          };
        }
      | {
          [K in "responsibleOrganizations" | "teamMembers"]?: {
            some: {
              [K in "organization" | "profile"]?: {
                AND: (
                  | {
                      [K in "name" | "firstName" | "lastName"]?: {
                        contains: string;
                        mode: Prisma.QueryMode;
                      };
                    }
                  | {
                      [K in "organizationVisibility" | "profileVisibility"]?: {
                        [K in Organization | Profile as string]: boolean;
                      };
                    }
                )[];
              };
            };
          };
        }
      | {
          [K in "projectVisibility"]?: {
            [K in Project as string]: boolean;
          };
        }
    )[];
  }[];
};
type WhereClause = {
  AND: ProjectVisibility[] & FilterKeyWhereStatement[] & SearchWhereStatement[];
};

function getProjectsFilterWhereClause(filter: GetProjectsSchema["prjFilter"]) {
  const whereClauses: WhereClause = { AND: [] };
  for (const filterKey in filter) {
    const typedFilterKey = filterKey as keyof typeof filter;
    const filterValues = filter[typedFilterKey];

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
  return whereClauses;
}

function getProjectsSearchWhereClauses(
  words: string[],
  sessionUser: User | null,
  language: ArrayElement<typeof supportedCookieLanguages>
) {
  const whereClauses = [];
  for (const word of words) {
    const formatSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "formats",
      word,
    });
    const disciplineSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "disciplines",
      word,
    });
    const projectTargetGroupSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "projectTargetGroups",
      word,
    });
    const specialTargetGroupSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "specialTargetGroups",
      word,
    });

    const contains: SearchWhereStatement = {
      OR: [
        {
          AND: [
            {
              name: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  projectVisibility: {
                    name: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              slug: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  projectVisibility: {
                    slug: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              headline: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  projectVisibility: {
                    headline: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              excerpt: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  projectVisibility: {
                    excerpt: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              description: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  projectVisibility: {
                    description: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              email: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  projectVisibility: {
                    email: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              city: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  projectVisibility: {
                    city: true,
                  },
                }
              : {},
          ],
        },
        {
          AND:
            disciplineSlug !== undefined
              ? [
                  {
                    disciplines: {
                      some: {
                        discipline: {
                          slug: {
                            contains: disciplineSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        projectVisibility: {
                          disciplines: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND: [
            {
              responsibleOrganizations: {
                some: {
                  organization: {
                    AND: [
                      {
                        name: {
                          contains: word,
                          mode: "insensitive",
                        },
                      },
                      sessionUser === null
                        ? {
                            organizationVisibility: {
                              name: true,
                            },
                          }
                        : {},
                    ],
                  },
                },
              },
            },
            sessionUser === null
              ? {
                  projectVisibility: {
                    responsibleOrganizations: true,
                  },
                }
              : {},
          ],
        },
        {
          AND:
            projectTargetGroupSlug !== undefined
              ? [
                  {
                    projectTargetGroups: {
                      some: {
                        projectTargetGroup: {
                          slug: {
                            contains: projectTargetGroupSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        projectVisibility: {
                          projectTargetGroups: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            specialTargetGroupSlug !== undefined
              ? [
                  {
                    specialTargetGroups: {
                      some: {
                        specialTargetGroup: {
                          slug: {
                            contains: specialTargetGroupSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        projectVisibility: {
                          specialTargetGroups: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            formatSlug !== undefined
              ? [
                  {
                    formats: {
                      some: {
                        format: {
                          slug: {
                            contains: formatSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        projectVisibility: {
                          formats: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND: [
            {
              teamMembers: {
                some: {
                  profile: {
                    AND: [
                      {
                        firstName: {
                          contains: word,
                          mode: "insensitive",
                        },
                      },
                      sessionUser === null
                        ? {
                            profileVisibility: {
                              firstName: true,
                            },
                          }
                        : {},
                    ],
                  },
                },
              },
            },
            sessionUser === null
              ? {
                  projectVisibility: {
                    teamMembers: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              areas: {
                some: {
                  area: {
                    name: {
                      contains: word,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
            sessionUser === null
              ? {
                  projectVisibility: {
                    areas: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              teamMembers: {
                some: {
                  profile: {
                    AND: [
                      {
                        lastName: {
                          contains: word,
                          mode: "insensitive",
                        },
                      },
                      sessionUser === null
                        ? {
                            profileVisibility: {
                              lastName: true,
                            },
                          }
                        : {},
                    ],
                  },
                },
              },
            },
            sessionUser === null
              ? {
                  projectVisibility: {
                    teamMembers: true,
                  },
                }
              : {},
          ],
        },
      ],
    };
    whereClauses.push(contains);
  }
  return whereClauses;
}

export async function getProjectIds(options: {
  filter: GetProjectsSchema["prjFilter"];
  search: GetSearchSchema["search"];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const filterWhereClause = getProjectsFilterWhereClause(options.filter);
  const searchWhereClauses = getProjectsSearchWhereClauses(
    options.search,
    options.sessionUser,
    options.language
  );
  filterWhereClause.AND.push(...searchWhereClauses);

  const whereClauses = filterWhereClause;

  const projects = await prismaClient.project.findMany({
    where: whereClauses,
    select: {
      id: true,
    },
  });
  const ids = projects.map((project) => {
    return project.id;
  });

  return ids;
}

export async function getAllProjects(options: {
  filter: GetProjectsSchema["prjFilter"];
  sortBy: GetProjectsSchema["prjSortBy"];
  take: ReturnType<typeof getTakeParam>;
  search: GetSearchSchema["search"];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const whereClauses = getProjectsFilterWhereClause(options.filter);

  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }
    if (options.sessionUser === null) {
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

  const searchWhereClauses = getProjectsSearchWhereClauses(
    options.search,
    options.sessionUser,
    options.language
  );
  whereClauses.AND.push(...searchWhereClauses);

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

export async function getProjectFilterVectorForAttribute(options: {
  attribute: keyof GetProjectsSchema["prjFilter"];
  filter: GetProjectsSchema["prjFilter"];
  search: GetSearchSchema["search"];
  ids: string[];
}) {
  const { attribute, filter, ids } = options;
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

  if (ids.length > 0 && options.search.length > 0) {
    whereStatements.push(`id IN (${ids.map((id) => `'${id}'`).join(", ")})`);
  }

  // Special case: if no profiles are found, but search isn't
  if (ids.length === 0 && options.search.length > 0) {
    whereStatements.push("id IN ('some-random-project-id')");
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
