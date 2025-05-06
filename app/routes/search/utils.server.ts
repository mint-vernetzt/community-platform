import type {
  Event,
  Organization,
  Prisma,
  Profile,
  Project,
} from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { getSlugFromLocaleThatContainsWord } from "~/i18n.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma.server";

export function getTakeParam(
  request: Request,
  options?: { itemsPerPage?: number; param?: string }
) {
  const { itemsPerPage = 12, param = "page" } = options || {};

  const url = new URL(request.url);
  const pageParam = url.searchParams.get(param) || "1";

  let page = parseInt(pageParam);
  if (Number.isNaN(page) || page < 1) {
    page = 1;
  }
  const take = itemsPerPage * page;

  return { take, page, itemsPerPage };
}

// **************
// Prismas like filtering with where contains
// - Performance: ~30 ms for full profile on search query 'Kontakt zu Unternehmen'
// - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-like
// - Fast implemented -> We have to write the where statement for each field on Profiles/Events, etc... -> see likeQueryMultiple()
// - Simple substring search is possible
// - How to sort by relevance?
// - Search on arrays is possible
// - Search on relations is possible

export function searchProfilesViaLike(options: {
  searchQuery: string[];
  sessionUser: User | null;
  take?: number;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, take, language } = options;
  const whereQueries = getProfileWhereQueries({
    searchQuery,
    sessionUser,
    language,
  });
  const profilesQuery = prismaClient.profile.findMany({
    select: {
      id: true,
      academicTitle: true,
      firstName: true,
      lastName: true,
      username: true,
      bio: true,
      avatar: true,
      position: true,
      score: true,
      background: true,
      areas: {
        select: {
          area: {
            select: {
              name: true,
            },
          },
        },
      },
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
          firstName: true,
          lastName: true,
          username: true,
          bio: true,
          avatar: true,
          position: true,
          score: true,
          background: true,
          areas: true,
          memberOf: true,
          offers: true,
        },
      },
    },
    where: {
      AND: whereQueries,
    },
    take: take,
    orderBy: [
      {
        score: "desc",
      },
      { updatedAt: "desc" },
      { firstName: "asc" },
    ],
  });
  return profilesQuery;
}

export function countSearchedProfiles(options: {
  searchQuery: string[];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, language } = options;
  const whereQueries = getProfileWhereQueries({
    searchQuery,
    sessionUser,
    language,
  });
  const profileCountQuery = prismaClient.profile.count({
    where: {
      AND: whereQueries,
    },
  });
  return profileCountQuery;
}

function getProfileWhereQueries(options: {
  searchQuery: string[];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, language } = options;
  const whereQueries = [];
  for (const word of searchQuery) {
    const offerOrSeekingSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "offers",
      word,
    });
    const contains: {
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
                          [K in
                            | "organizationVisibility"
                            | "projectVisibility"]?: {
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
    } = {
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
    whereQueries.push(contains);
  }
  return whereQueries;
}

export function searchOrganizationsViaLike(options: {
  searchQuery: string[];
  sessionUser: User | null;
  take?: number;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, take, language } = options;
  const whereQueries = getOrganizationWhereQueries({
    searchQuery,
    sessionUser,
    language,
  });
  const organizationsQuery = prismaClient.organization.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      background: true,
      bio: true,
      areas: {
        select: {
          area: {
            select: {
              name: true,
            },
          },
        },
      },
      types: {
        select: {
          organizationType: {
            select: {
              slug: true,
            },
          },
        },
      },
      networkTypes: {
        select: {
          networkType: {
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
      teamMembers: {
        select: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              username: true,
              profileVisibility: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  username: true,
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
          logo: true,
          background: true,
          bio: true,
          areas: true,
          types: true,
          focuses: true,
          teamMembers: true,
        },
      },
    },
    where: {
      AND: whereQueries,
    },
    take: take,
    orderBy: [
      {
        score: "desc",
      },
      { updatedAt: "desc" },
      { name: "asc" },
    ],
  });
  return organizationsQuery;
}

export function countSearchedOrganizations(options: {
  searchQuery: string[];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, language } = options;
  const whereQueries = getOrganizationWhereQueries({
    searchQuery,
    sessionUser,
    language,
  });
  const organizationCountQuery = prismaClient.organization.count({
    where: {
      AND: whereQueries,
    },
  });
  return organizationCountQuery;
}

function getOrganizationWhereQueries(options: {
  searchQuery: string[];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, language } = options;
  const whereQueries = [];
  for (const word of searchQuery) {
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
    const contains: {
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
                  [K in
                    | "area"
                    | "organizationType"
                    | "networkType"
                    | "focus"]?: {
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
    } = {
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
    whereQueries.push(contains);
  }
  return whereQueries;
}

export function searchEventsViaLike(options: {
  searchQuery: string[];
  sessionUser: User | null;
  take?: number;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, take, language } = options;
  const whereQueries = getEventWhereQueries({
    searchQuery,
    sessionUser,
    language,
  });
  const eventsQuery = prismaClient.event.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentEventId: true,
      startTime: true,
      endTime: true,
      participationUntil: true,
      participationFrom: true,
      participantLimit: true,
      background: true,
      published: true,
      stage: {
        select: {
          slug: true,
        },
      },
      canceled: true,
      subline: true,
      description: true,
      _count: {
        select: {
          childEvents: true,
          participants: true,
          responsibleOrganizations: true,
          waitingList: true,
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
      eventVisibility: {
        select: {
          id: true,
          name: true,
          slug: true,
          parentEventId: true,
          startTime: true,
          endTime: true,
          participationUntil: true,
          participationFrom: true,
          participantLimit: true,
          background: true,
          published: true,
          stage: true,
          canceled: true,
          subline: true,
          description: true,
          responsibleOrganizations: true,
        },
      },
    },
    where: {
      AND: [{ published: true }, ...whereQueries],
    },
    take: take,
    orderBy: {
      startTime: "desc",
    },
  });
  return eventsQuery;
}

export function countSearchedEvents(options: {
  searchQuery: string[];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, language } = options;
  const whereQueries = getEventWhereQueries({
    searchQuery,
    sessionUser,
    language,
  });
  const eventCountQuery = prismaClient.event.count({
    where: {
      AND: [{ published: true }, ...whereQueries],
    },
  });
  return eventCountQuery;
}

function getEventWhereQueries(options: {
  searchQuery: string[];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, language } = options;
  const whereQueries = [];
  for (const word of searchQuery) {
    const eventTypeSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "eventTypes",
      word,
    });
    const focusSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "focuses",
      word,
    });
    const tagSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "tags",
      word,
    });
    const eventTargetGroupSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "eventTargetGroups",
      word,
    });
    const experienceLevelSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "experienceLevels",
      word,
    });
    const stageSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "stages",
      word,
    });

    const contains: {
      OR: {
        AND: (
          | {
              [K in Event as string]: {
                contains: string;
                mode: Prisma.QueryMode;
              };
            }
          | {
              [K in
                | "areas"
                | "types"
                | "focuses"
                | "tags"
                | "eventTargetGroups"]?: {
                some: {
                  [K in
                    | "area"
                    | "eventType"
                    | "focus"
                    | "tag"
                    | "eventTargetGroup"]?: {
                    [K in "name" | "slug"]?: {
                      contains: string;
                      mode: Prisma.QueryMode;
                    };
                  };
                };
              };
            }
          | {
              [K in "experienceLevel" | "stage"]?: {
                [K in "slug"]?: {
                  contains: string;
                  mode: Prisma.QueryMode;
                };
              };
            }
          | {
              [K in "eventVisibility"]?: {
                [K in Event as string]: boolean;
              };
            }
        )[];
      }[];
    } = {
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
                  eventVisibility: {
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
                  eventVisibility: {
                    slug: true,
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
                  eventVisibility: {
                    description: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              venueName: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  eventVisibility: {
                    venueName: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              venueStreet: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  eventVisibility: {
                    venueStreet: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              venueStreetNumber: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  eventVisibility: {
                    venueStreetNumber: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              venueCity: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  eventVisibility: {
                    venueCity: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              subline: {
                contains: word,
                mode: "insensitive",
              },
            },
            sessionUser === null
              ? {
                  eventVisibility: {
                    subline: true,
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
                  eventVisibility: {
                    areas: true,
                  },
                }
              : {},
          ],
        },
        {
          AND:
            eventTypeSlug !== undefined
              ? [
                  {
                    types: {
                      some: {
                        eventType: {
                          slug: {
                            contains: eventTypeSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        eventVisibility: {
                          types: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            experienceLevelSlug !== undefined
              ? [
                  {
                    experienceLevel: {
                      slug: {
                        contains: experienceLevelSlug,
                        mode: "insensitive",
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        eventVisibility: {
                          experienceLevel: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            stageSlug !== undefined
              ? [
                  {
                    stage: {
                      slug: {
                        contains: stageSlug,
                        mode: "insensitive",
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        eventVisibility: {
                          stage: true,
                        },
                      }
                    : {},
                ]
              : [],
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
                        eventVisibility: {
                          focuses: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            tagSlug !== undefined
              ? [
                  {
                    tags: {
                      some: {
                        tag: {
                          slug: {
                            contains: tagSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        eventVisibility: {
                          tags: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            eventTargetGroupSlug !== undefined
              ? [
                  {
                    eventTargetGroups: {
                      some: {
                        eventTargetGroup: {
                          slug: {
                            contains: eventTargetGroupSlug,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  sessionUser === null
                    ? {
                        eventVisibility: {
                          targetGroups: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
      ],
    };
    whereQueries.push(contains);
  }
  return whereQueries;
}

export function searchProjectsViaLike(options: {
  searchQuery: string[];
  sessionUser: User | null;
  take?: number;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, take, language } = options;
  const whereQueries = getProjectWhereQueries({
    searchQuery,
    sessionUser,
    language,
  });
  const projectsQuery = prismaClient.project.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      background: true,
      excerpt: true,
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
          responsibleOrganizations: true,
        },
      },
    },
    where: {
      AND: [...whereQueries, { published: true }],
    },
    take: take,
    orderBy: {
      name: "asc",
    },
  });
  return projectsQuery;
}

export function countSearchedProjects(options: {
  searchQuery: string[];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, language } = options;
  const whereQueries = getProjectWhereQueries({
    searchQuery,
    sessionUser,
    language,
  });
  const projectCountQuery = prismaClient.project.count({
    where: {
      AND: [...whereQueries, { published: true }],
    },
  });
  return projectCountQuery;
}

function getProjectWhereQueries(options: {
  searchQuery: string[];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const { searchQuery, sessionUser, language } = options;
  const whereQueries = [];
  for (const word of searchQuery) {
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

    const contains: {
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
                          [K in
                            | "organizationVisibility"
                            | "profileVisibility"]?: {
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
    } = {
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
    whereQueries.push(contains);
  }
  return whereQueries;
}

export function searchFundingsViaLike(searchQuery: string[], take?: number) {
  const whereQueries = getFundingWhereQueries(searchQuery);
  const fundingsQuery = prismaClient.funding.findMany({
    select: {
      title: true,
      url: true,
      funders: {
        select: {
          funder: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      types: {
        select: {
          type: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      areas: {
        select: {
          area: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      eligibleEntities: {
        select: {
          entity: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      regions: {
        select: {
          area: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
      sourceEntities: true,
      sourceAreas: true,
    },
    where: {
      AND: [...whereQueries],
    },
    take: take,
    orderBy: {
      title: "asc",
    },
  });
  return fundingsQuery;
}

export function countSearchedFundings(searchQuery: string[]) {
  const whereQueries = getFundingWhereQueries(searchQuery);
  const fundingCountQuery = prismaClient.funding.count({
    where: {
      AND: [...whereQueries],
    },
  });
  return fundingCountQuery;
}

function getFundingWhereQueries(searchQuery: string[]) {
  const whereQueries = [];
  for (const word of searchQuery) {
    const contains: {
      OR: (
        | {
            [K in "url" | "title"]?: {
              contains: string;
              mode: Prisma.QueryMode;
            };
          }
        | {
            [K in
              | "sourceAreas"
              | "sourceEntities"
              | "sourceFunders"
              | "sourceRegions"
              | "sourceTypes"]?: {
              has: string;
            };
          }
        | {
            [K in "regions"]?: {
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
            [K in "funders" | "types" | "areas" | "eligibleEntities"]?: {
              some: {
                [K in "funder" | "type" | "area" | "entity"]?: {
                  [K in "title"]?: {
                    contains: string;
                    mode: Prisma.QueryMode;
                  };
                };
              };
            };
          }
      )[];
    } = {
      OR: [
        {
          url: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          title: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          sourceAreas: {
            has: word,
          },
        },
        {
          sourceEntities: {
            has: word,
          },
        },
        {
          sourceFunders: {
            has: word,
          },
        },
        {
          sourceRegions: {
            has: word,
          },
        },
        {
          sourceTypes: {
            has: word,
          },
        },
        {
          regions: {
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
        {
          funders: {
            some: {
              funder: {
                title: {
                  contains: word,
                  mode: "insensitive",
                },
              },
            },
          },
        },
        {
          types: {
            some: {
              type: {
                title: {
                  contains: word,
                  mode: "insensitive",
                },
              },
            },
          },
        },
        {
          areas: {
            some: {
              area: {
                title: {
                  contains: word,
                  mode: "insensitive",
                },
              },
            },
          },
        },
        {
          eligibleEntities: {
            some: {
              entity: {
                title: {
                  contains: word,
                  mode: "insensitive",
                },
              },
            },
          },
        },
      ],
    };
    whereQueries.push(contains);
  }
  return whereQueries;
}

export async function enhanceEventsWithParticipationStatus(
  sessionUser: User | null,
  events: Array<
    ArrayElement<Awaited<ReturnType<typeof searchEventsViaLike>>> & {
      blurredBackground: string | undefined;
    }
  >
) {
  if (sessionUser === null) {
    const enhancedEvents = events.map((item) => {
      const isParticipant = false;
      const isOnWaitingList = false;
      const isSpeaker = false;
      const isTeamMember = false;

      return {
        ...item,
        isParticipant,
        isOnWaitingList,
        isSpeaker,
        isTeamMember,
      };
    });
    return enhancedEvents;
  } else {
    const eventIdsWhereParticipant = (
      await prismaClient.participantOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereOnWaitingList = (
      await prismaClient.waitingParticipantOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereSpeaker = (
      await prismaClient.speakerOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereTeamMember = (
      await prismaClient.teamMemberOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);

    const enhancedEvents = events.map((item) => {
      const isParticipant = eventIdsWhereParticipant.includes(item.id);
      const isOnWaitingList = eventIdsWhereOnWaitingList.includes(item.id);
      const isSpeaker = eventIdsWhereSpeaker.includes(item.id);
      const isTeamMember = eventIdsWhereTeamMember.includes(item.id);

      return {
        ...item,
        isParticipant,
        isOnWaitingList,
        isSpeaker,
        isTeamMember,
      };
    });
    return enhancedEvents;
  }
}

// **************
// 1. Prismas preview feature of Postgresql Full-Text Search
// - Performance: ~15 ms for full profile on search query 'Kontakt zu Unternehmen'
// - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-postgres-fts
// - Fast implemented -> We have to write the where statement for each field on Profiles/Events, etc... -> see prismasFtsQuery()
// - No substring search
// - How to search on string arrays ? -> see profile.skills

// How to format search query to make it prisma fts compatible
//const searchQueryForFTS = "'Unicode'"; // Mind the single quotes!
//const searchQueryForFTSMultiple = "'Kontakt' | 'zu' | 'Unternehmen'"; // Mind the single quotes!
export async function prismasFtsQuery(searchQuery: string) {
  console.log("\n********************************************\n");
  console.time();
  const profiles = await prismaClient.profile.findMany({
    select: {
      firstName: true,
      email: true,
    },
    where: {
      OR: [
        {
          firstName: {
            search: searchQuery,
          },
        },
        {
          offers: {
            some: {
              offer: {
                title: {
                  search: searchQuery,
                },
              },
            },
          },
        },
        {
          username: {
            search: searchQuery,
          },
        },
        {
          email: {
            search: searchQuery,
          },
        },
        {
          phone: {
            search: searchQuery,
          },
        },
        {
          website: {
            search: searchQuery,
          },
        },
        {
          facebook: {
            search: searchQuery,
          },
        },
        {
          linkedin: {
            search: searchQuery,
          },
        },
        {
          twitter: {
            search: searchQuery,
          },
        },
        {
          xing: {
            search: searchQuery,
          },
        },
        {
          instagram: {
            search: searchQuery,
          },
        },
        {
          youtube: {
            search: searchQuery,
          },
        },
        {
          bio: {
            search: searchQuery,
          },
        },
        // Not supported ? String Arrays
        // { skills: {} },
        // { interests: {} },
        {
          academicTitle: {
            search: searchQuery,
          },
        },
        {
          firstName: {
            search: searchQuery,
          },
        },
        {
          lastName: {
            search: searchQuery,
          },
        },
        {
          position: {
            search: searchQuery,
          },
        },
        {
          areas: {
            some: {
              area: {
                name: {
                  search: searchQuery,
                },
              },
            },
          },
        },
        {
          seekings: {
            some: {
              offer: {
                title: {
                  search: searchQuery,
                },
              },
            },
          },
        },
      ],
    },
  });
  console.timeEnd();
  console.log("\n********************************************\n");

  return profiles;
}

// Other postgres search options:
// **************
// Build full text index inside schema with ts vector/ ts query

// **************
// Own full text search field

// **************
// Creating a postgres view

export function getQueryValueAsArrayOfWords(request: Request) {
  const url = new URL(request.url);
  const queryString = url.searchParams.get("query") || undefined;
  const query =
    queryString === undefined || queryString === ""
      ? []
      : queryString.split(" ");
  return query;
}

export function getQuerySearchParam(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query") || undefined;
  return query;
}

export function getTypeValue(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  return type;
}

// Enable prisma logging
// export function prismaLog() {
//   prismaClient.$on("query", (e) => {
//     console.log("Query: " + e.query);
//     console.log("Params: " + e.params);
//     console.log("Duration: " + e.duration + "ms");
//   });
// }
