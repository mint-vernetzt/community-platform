import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { type GetProfilesSchema } from "./profiles.shared";
import { type GetSearchSchema } from "./all.shared";
import { type User } from "@supabase/supabase-js";
import {
  type Organization,
  type Prisma,
  type Profile,
  type Project,
} from "@prisma/client";
import { getSlugFromLocaleThatContainsWord } from "~/i18n.server";

export type ExploreProfilesLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["explore/profiles"];

export function getTakeParam(page: GetProfilesSchema["prfPage"]) {
  const itemsPerPage = 12;
  const take = itemsPerPage * page;
  return take;
}

type ProfileVisibility = { profileVisibility: { [x: string]: boolean } };
type FilterKeyWhereStatement = {
  OR: { [x: string]: { some: { [x: string]: { slug: string } } } }[];
};
type SearchWhereStatement = {
  OR: {
    AND: (
      | {
          [K in Profile as string]: {
            contains: string;
            mode: Prisma.QueryMode;
          };
        }
      | {
          [K in "areas" | "offers" | "seekings"]?: {
            some: {
              [K in "area" | "offer"]?: {
                [K in "name" | "slug"]?: {
                  contains: string;
                  mode: Prisma.QueryMode;
                };
              };
            };
          };
        }
      | {
          [K in "memberOf" | "teamMemberOfProjects"]?: {
            some: {
              [K in "organization" | "project"]?: {
                AND: (
                  | {
                      [K in "name"]?: {
                        contains: string;
                        mode: Prisma.QueryMode;
                      };
                    }
                  | {
                      [K in "organizationVisibility" | "projectVisibility"]?: {
                        [K in Organization | Project as string]: boolean;
                      };
                    }
                )[];
              };
            };
          };
        }
      | {
          [K in "skills" | "interests"]?: {
            has: string;
          };
        }
      | {
          [K in "profileVisibility"]?: {
            [K in Profile as string]: boolean;
          };
        }
    )[];
  }[];
};
type WhereClause = {
  AND: ProfileVisibility[] & FilterKeyWhereStatement[] & SearchWhereStatement[];
};

function getProfilesFilterWhereClause(filter: GetProfilesSchema["prfFilter"]) {
  const whereClauses: WhereClause = { AND: [] };
  for (const filterKey in filter) {
    const typedFilterKey = filterKey as keyof typeof filter;
    const filterValues = filter[typedFilterKey];

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

function getProfilesSearchWhereClauses(
  words: string[],
  isLoggedIn: boolean,
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>
) {
  const whereClauses = [];
  for (const word of words) {
    const offerOrSeekingSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "offers",
      word,
    });
    const contains: SearchWhereStatement = {
      OR: [
        {
          AND: [
            {
              username: {
                contains: word,
                mode: "insensitive",
              },
            },
            isLoggedIn === false
              ? {
                  profileVisibility: {
                    username: true,
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
                  profileVisibility: {
                    email: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              email2: {
                contains: word,
                mode: "insensitive",
              },
            },
            isLoggedIn === false
              ? {
                  profileVisibility: {
                    email2: true,
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
                  profileVisibility: {
                    bio: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              skills: {
                has: word,
              },
            },
            isLoggedIn === false
              ? {
                  profileVisibility: {
                    skills: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              interests: {
                has: word,
              },
            },
            isLoggedIn === false
              ? {
                  profileVisibility: {
                    interests: true,
                  },
                }
              : {},
          ],
        },
        {
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
        {
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
        {
          AND: [
            {
              position: {
                contains: word,
                mode: "insensitive",
              },
            },
            isLoggedIn === false
              ? {
                  profileVisibility: {
                    position: true,
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
                  profileVisibility: {
                    areas: true,
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
                  organization: {
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
                  profileVisibility: {
                    memberOf: true,
                  },
                }
              : {},
          ],
        },
        {
          AND:
            offerOrSeekingSlug !== undefined
              ? [
                  {
                    offers: {
                      some: {
                        offer: {
                          slug: {
                            contains: offerOrSeekingSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  isLoggedIn === false
                    ? {
                        profileVisibility: {
                          offers: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            offerOrSeekingSlug !== undefined
              ? [
                  {
                    seekings: {
                      some: {
                        offer: {
                          slug: {
                            contains: offerOrSeekingSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  isLoggedIn === false
                    ? {
                        profileVisibility: {
                          seekings: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND: [
            {
              teamMemberOfProjects: {
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
                  profileVisibility: {
                    teamMemberOfProjects: true,
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

export async function getProfileIds(options: {
  filter: GetProfilesSchema["prfFilter"];
  search: GetSearchSchema["search"];
  isLoggedIn: boolean;
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
}) {
  const whereClauses = getProfilesFilterWhereClause(options.filter);

  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }
    if (options.isLoggedIn === false) {
      const visibilityWhereStatement: ProfileVisibility = {
        profileVisibility: {
          [`${typedFilterKey}s`]: true,
        },
      };
      whereClauses.AND.push(visibilityWhereStatement);
    }
  }

  const searchWhereClauses = getProfilesSearchWhereClauses(
    options.search,
    options.isLoggedIn,
    options.language
  );

  whereClauses.AND.push(...searchWhereClauses);

  const profiles = await prismaClient.profile.findMany({
    where: whereClauses,
    select: {
      id: true,
    },
  });

  const ids = profiles.map((profile) => {
    return profile.id;
  });

  return ids;
}

export async function getAllProfiles(options: {
  filter: GetProfilesSchema["prfFilter"];
  sortBy: GetProfilesSchema["prfSortBy"];
  take: ReturnType<typeof getTakeParam>;
  search: GetSearchSchema["search"];
  sessionUser: User | null;
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
}) {
  const whereClauses = getProfilesFilterWhereClause(options.filter);

  const isLoggedIn = options.sessionUser !== null;

  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }
    if (isLoggedIn === false) {
      const visibilityWhereStatement: ProfileVisibility = {
        profileVisibility: {
          [`${typedFilterKey}s`]: true,
        },
      };
      whereClauses.AND.push(visibilityWhereStatement);
    }
  }

  const searchWhereClauses = getProfilesSearchWhereClauses(
    options.search,
    isLoggedIn,
    options.language
  );
  whereClauses.AND.push(...searchWhereClauses);

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
              slug: true,
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
    orderBy: [
      {
        [options.sortBy.split("-")[0]]: options.sortBy.split("-")[1],
      },
      {
        id: "asc",
      },
    ],
    take: options.take,
  });

  return profiles;
}

export async function getProfileFilterVectorForAttribute(options: {
  attribute: keyof GetProfilesSchema["prfFilter"];
  filter: GetProfilesSchema["prfFilter"];
  search: GetSearchSchema["search"];
  ids: string[];
}) {
  const { attribute, filter, ids } = options;
  let whereClause = "";
  const whereStatements: string[] = [];
  for (const filterKey in filter) {
    const typedFilterKey = filterKey as keyof typeof filter;
    if (typedFilterKey === attribute) {
      continue;
    }
    const filterValues = filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }

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
    whereStatements.push("id IN ('some-random-profile-id')");
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
  filterVector: Awaited<ReturnType<typeof getProfileFilterVectorForAttribute>>,
  attribute: ArrayElement<
    Awaited<ReturnType<typeof getProfileFilterVectorForAttribute>>
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
      slug: true,
    },
  });
}
