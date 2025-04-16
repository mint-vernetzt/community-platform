import { type supportedCookieLanguages } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { type GetOrganizationsSchema } from "./organizations";
import { type GetSearchSchema } from "./index";
import { type User } from "@supabase/supabase-js";
import { getSlugFromLocaleThatContainsWord } from "~/i18n.server";
import {
  type Profile,
  type Project,
  type Organization,
  type Prisma,
} from "@prisma/client";

export type ExploreOrganizationsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["explore/organizations"];

export function getTakeParam(page: GetOrganizationsSchema["orgPage"]) {
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
type SearchWhereStatement = {
  OR: {
    AND: (
      | {
          [K in Organization as string]: {
            contains: string;
            mode: Prisma.QueryMode;
          };
        }
      | {
          [K in "areas" | "types" | "networkTypes" | "focuses"]?: {
            some: {
              [K in "area" | "organizationType" | "networkType" | "focus"]?: {
                [K in "name" | "slug"]?: {
                  contains: string;
                  mode: Prisma.QueryMode;
                };
              };
            };
          };
        }
      | {
          [K in
            | "networkMembers"
            | "memberOf"
            | "teamMembers"
            | "responsibleForProject"]?: {
            some: {
              [K in "networkMember" | "network" | "profile" | "project"]?: {
                AND: (
                  | {
                      [K in "name" | "firstName" | "lastName"]?: {
                        contains: string;
                        mode: Prisma.QueryMode;
                      };
                    }
                  | {
                      [K in
                        | "organizationVisibility"
                        | "projectVisibility"
                        | "profileVisibility"]?: {
                        [K in
                          | Organization
                          | Project
                          | Profile as string]: boolean;
                      };
                    }
                )[];
              };
            };
          };
        }
      | {
          supportedBy: {
            has: string;
          };
        }
      | {
          [K in "organizationVisibility"]?: {
            [K in Organization as string]: boolean;
          };
        }
    )[];
  }[];
};
type WhereClause = {
  AND: OrganizationVisibility[] &
    FilterKeyWhereStatement[] &
    SearchWhereStatement[];
};

function getOrganizationsFilterWhereClause(
  filter: GetOrganizationsSchema["orgFilter"]
) {
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

  return whereClauses;
}

function getOrganizationsSearchWhereClause(
  words: string[],
  sessionUser: User | null,
  language: ArrayElement<typeof supportedCookieLanguages>
) {
  const whereClauses = [];

  for (const word of words) {
    const focusSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "focuses",
      word,
    });
    const organizationTypeSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "organizationTypes",
      word,
    });
    const networkTypeSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "networkTypes",
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
                  organizationVisibility: {
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
                  organizationVisibility: {
                    slug: true,
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
                  organizationVisibility: {
                    email: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              street: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  organizationVisibility: {
                    street: true,
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
                  organizationVisibility: {
                    city: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              bio: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  organizationVisibility: {
                    bio: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              supportedBy: {
                has: word,
              },
            },
            sessionUser === null
              ? {
                  organizationVisibility: {
                    supportedBy: true,
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
                  organizationVisibility: {
                    areas: true,
                  },
                }
              : {},
          ],
        },
        {
          AND:
            focusSlug !== undefined
              ? [
                  {
                    focuses: {
                      some: {
                        focus: {
                          slug: {
                            contains: focusSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        organizationVisibility: {
                          focuses: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND: [
            {
              networkMembers: {
                some: {
                  networkMember: {
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
                  organizationVisibility: {
                    networkMembers: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              memberOf: {
                some: {
                  network: {
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
                  organizationVisibility: {
                    memberOf: true,
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
                  organizationVisibility: {
                    teamMembers: true,
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
                  organizationVisibility: {
                    teamMembers: true,
                  },
                }
              : {},
          ],
        },
        {
          AND:
            organizationTypeSlug !== undefined
              ? [
                  {
                    types: {
                      some: {
                        organizationType: {
                          slug: {
                            contains: organizationTypeSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        organizationVisibility: {
                          types: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            networkTypeSlug !== undefined
              ? [
                  {
                    networkTypes: {
                      some: {
                        networkType: {
                          slug: {
                            contains: networkTypeSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        organizationVisibility: {
                          networkTypes: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND: [
            {
              responsibleForProject: {
                some: {
                  project: {
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
                },
              },
            },
            sessionUser === null
              ? {
                  organizationVisibility: {
                    responsibleForProject: true,
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

export async function getOrganizationIds(options: {
  filter: GetOrganizationsSchema["orgFilter"];
  search: GetSearchSchema["search"];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const filterWhereClause = getOrganizationsFilterWhereClause(options.filter);
  const searchWhereClauses = getOrganizationsSearchWhereClause(
    options.search,
    options.sessionUser,
    options.language
  );

  filterWhereClause.AND.push(...searchWhereClauses);

  const whereClauses = filterWhereClause;

  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
    },
    where: whereClauses,
  });

  const ids = organizations.map((organization) => {
    return organization.id;
  });

  return ids;
}

export async function getAllOrganizations(options: {
  filter: GetOrganizationsSchema["orgFilter"];
  sortBy: GetOrganizationsSchema["orgSortBy"];
  take: ReturnType<typeof getTakeParam>;
  search: GetSearchSchema["search"];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const whereClauses = getOrganizationsFilterWhereClause(options.filter);

  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }
    if (options.sessionUser === null) {
      const visibilityWhereStatement = {
        organizationVisibility: {
          [`${typedFilterKey}${typedFilterKey === "focus" ? "es" : "s"}`]: true,
        },
      };
      whereClauses.AND.push(visibilityWhereStatement);
    }
  }

  const searchWhereClauses = getOrganizationsSearchWhereClause(
    options.search,
    options.sessionUser,
    options.language
  );
  whereClauses.AND.push(...searchWhereClauses);

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

export async function getOrganizationFilterVectorForAttribute(options: {
  attribute: keyof GetOrganizationsSchema["orgFilter"];
  filter: GetOrganizationsSchema["orgFilter"];
  search: GetSearchSchema["search"];
  ids: string[];
}) {
  const { attribute, filter, ids } = options;
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

  if (ids.length > 0) {
    whereStatements.push(`id IN (${ids.map((id) => `'${id}'`).join(", ")})`);
  }

  // Special case: if no profiles are found, but search isn't
  if (ids.length === 0 && options.search.length > 0) {
    whereStatements.push("id IN ('some-random-organization-id')");
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
