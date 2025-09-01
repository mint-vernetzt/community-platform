import {
  type Organization,
  type Prisma,
  type Profile,
  type Project,
} from "@prisma/client";
import { getAllSlugsFromLocaleThatContainsWord } from "~/i18n.server";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { type GetSearchSchema } from "./all.shared";
import { type GetOrganizationsSchema } from "./organizations.shared";
import { createCookie } from "react-router";
import { z } from "zod";

export type ExploreOrganizationsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof SUPPORTED_COOKIE_LANGUAGES
  >]["explore/organizations"];

const VIEW_COOKIE_NAME = "mv-explore-organizations-view" as const;
const VIEW_COOKIE_MAX_AGE = 31540000 as const;
export const VIEW_COOKIE_VALUES = {
  list: "list",
  map: "map",
} as const;

export const viewCookieSchema = z.enum([
  VIEW_COOKIE_VALUES.list,
  VIEW_COOKIE_VALUES.map,
]);

export const viewCookie = createCookie(VIEW_COOKIE_NAME, {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  // 1 year
  maxAge: VIEW_COOKIE_MAX_AGE,
});

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
          areas: {
            some: {
              area: {
                name: {
                  contains: string;
                  mode: Prisma.QueryMode;
                };
              };
            };
          };
        }
      | {
          [K in "types" | "networkTypes" | "focuses"]?: {
            some: {
              [K in "organizationType" | "networkType" | "focus"]?: {
                slug: {
                  in: string[];
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
      let key: string;
      if (typedFilterKey === "focus") {
        key = "focuses";
      } else if (typedFilterKey === "network") {
        key = "memberOf";
      } else {
        key = `${typedFilterKey}s`;
      }

      let childKey: string;
      if (typedFilterKey === "type") {
        childKey = "organizationType";
      } else {
        childKey = typedFilterKey;
      }

      const filterWhereStatement = {
        [key]: {
          some: {
            [childKey]: {
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
  isLoggedIn: boolean,
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>
) {
  const whereClauses = [];

  for (const word of words) {
    const focusSlugs = getAllSlugsFromLocaleThatContainsWord({
      language,
      locales: "focuses",
      word,
    });
    const organizationTypeSlugs = getAllSlugsFromLocaleThatContainsWord({
      language,
      locales: "organizationTypes",
      word,
    });
    const networkTypeSlugs = getAllSlugsFromLocaleThatContainsWord({
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
            isLoggedIn === false
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
            isLoggedIn === false
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
            isLoggedIn === false
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
            isLoggedIn === false
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
            isLoggedIn === false
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
            isLoggedIn === false
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
            isLoggedIn === false
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
            isLoggedIn === false
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
            focusSlugs.length > 0
              ? [
                  {
                    focuses: {
                      some: {
                        focus: {
                          slug: {
                            in: focusSlugs,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  isLoggedIn === false
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
                      isLoggedIn === false
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
            isLoggedIn === false
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
                      isLoggedIn === false
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
            isLoggedIn === false
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
                      isLoggedIn === false
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
            isLoggedIn === false
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
                      isLoggedIn === false
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
            isLoggedIn === false
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
            organizationTypeSlugs.length > 0
              ? [
                  {
                    types: {
                      some: {
                        organizationType: {
                          slug: {
                            in: organizationTypeSlugs,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  isLoggedIn === false
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
            networkTypeSlugs.length > 0
              ? [
                  {
                    networkTypes: {
                      some: {
                        networkType: {
                          slug: {
                            in: networkTypeSlugs,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  isLoggedIn === false
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
                      isLoggedIn === false
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
            isLoggedIn === false
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

export function getOrganizationWhereClauses(options: {
  filter: GetOrganizationsSchema["orgFilter"];
  search: GetSearchSchema["search"];
  isLoggedIn: boolean;
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
}) {
  const { filter, search, isLoggedIn, language } = options;

  const whereClauses = getOrganizationsFilterWhereClause(filter);

  for (const filterKey in filter) {
    const typedFilterKey = filterKey as keyof typeof filter;
    const filterValues = filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }
    if (isLoggedIn === false) {
      let key: string;
      if (typedFilterKey === "focus") {
        key = "focuses";
      } else if (typedFilterKey === "network") {
        key = "memberOf";
      } else {
        key = `${typedFilterKey}s`;
      }

      const visibilityWhereStatement = {
        organizationVisibility: {
          [key]: true,
        },
      };
      whereClauses.AND.push(visibilityWhereStatement);
    }
  }

  const searchWhereClauses = getOrganizationsSearchWhereClause(
    search,
    isLoggedIn,
    language
  );
  whereClauses.AND.push(...searchWhereClauses);

  return whereClauses;
}

export async function getOrganizationIds(options: {
  filter: GetOrganizationsSchema["orgFilter"];
  search: GetSearchSchema["search"];
  isLoggedIn: boolean;
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
}) {
  const { filter, search, isLoggedIn, language } = options;

  const whereClauses = getOrganizationWhereClauses({
    filter,
    search,
    isLoggedIn,
    language,
  });

  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
    },
    where: {
      ...whereClauses,
      name: {
        not: "",
      },
    },
  });

  const ids = organizations.map((organization) => {
    return organization.id;
  });

  return ids;
}

export async function getAllNetworks() {
  const networks = await prismaClient.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
    },
    where: {
      types: {
        some: {
          organizationType: {
            slug: "network",
          },
        },
      },
    },
    orderBy: [
      {
        name: "asc",
      },
    ],
  });

  return networks;
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
      let key: string;
      if (typedFilterKey === "type") {
        key = "organizationType";
      } else if (typedFilterKey === "network") {
        key = "organization";
      } else {
        key = fakeTypedFilterKey;
      }

      allPossibleFilterValues = await prismaClient[
        key as typeof fakeTypedFilterKey
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

  if (ids.length > 0 && options.search.length > 0) {
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

export async function getAllNetworkTypes() {
  return await prismaClient.networkType.findMany({
    orderBy: {
      slug: "asc",
    },
    select: {
      id: true,
      slug: true,
    },
  });
}
