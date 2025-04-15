import { type supportedCookieLanguages } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { type GetProfilesSchema } from "./profiles";
import { type GetSearchSchema } from "./index";
import { type User } from "@supabase/supabase-js";
import {
  type Organization,
  type Prisma,
  type Profile,
  type Project,
} from "@prisma/client";

export type ExploreProfilesLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
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

function getSlugFromLocaleThatContainsWord(options: {
  language: ArrayElement<typeof supportedCookieLanguages>;
  locales: keyof (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >];
  word: string;
}) {
  const { language, locales, word } = options;
  const slugs = Object.entries(languageModuleMap[language][locales]).find(
    ([, value]) => {
      if (
        typeof value !== "object" &&
        "title" in value === false &&
        typeof value.title !== "string"
      ) {
        return false;
      }
      return (value.title as string).toLowerCase().includes(word.toLowerCase());
    }
  );

  if (typeof slugs === "undefined") {
    return;
  }
  return slugs[0];
}

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
  sessionUser: User | null,
  language: ArrayElement<typeof supportedCookieLanguages>
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
            sessionUser === null
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
            sessionUser === null
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
            sessionUser === null
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
            sessionUser === null
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
            sessionUser === null
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
            sessionUser === null
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
            sessionUser === null
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
            sessionUser === null
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
            sessionUser === null
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
            sessionUser === null
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
                  sessionUser === null
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
                  sessionUser === null
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

export async function getProfilesIds(options: {
  filter: GetProfilesSchema["prfFilter"];
  search: GetSearchSchema["search"];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const filterWhereClause = getProfilesFilterWhereClause(options.filter);
  const searchWhereClauses = getProfilesSearchWhereClauses(
    options.search,
    options.sessionUser,
    options.language
  );

  filterWhereClause.AND.push(...searchWhereClauses);

  const whereClauses = filterWhereClause;

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
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const whereClauses: WhereClause = { AND: [] };

  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }
    if (options.sessionUser === null) {
      const visibilityWhereStatement: ProfileVisibility = {
        profileVisibility: {
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

  const searchWhereClauses = getProfilesSearchWhereClauses(
    options.search,
    options.sessionUser,
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
        [options.sortBy.value]: options.sortBy.direction,
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

  if (ids.length > 0) {
    whereStatements.push(`id IN (${ids.map((id) => `'${id}'`).join(", ")})`);
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
