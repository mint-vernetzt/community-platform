import type {
  Event,
  Organization,
  Prisma,
  Profile,
  Project,
} from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { type ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma.server";

// **************
// Prismas like filtering with where contains
// - Performance: ~30 ms for full profile on search query 'Kontakt zu Unternehmen'
// - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-like
// - Fast implemented -> We have to write the where statement for each field on Profiles/Events, etc... -> see likeQueryMultiple()
// - Simple substring search is possible
// - How to sort by relevance?
// - Search on arrays is possible
// - Search on relations is possible

export async function searchProfilesViaLike(
  searchQuery: string[],
  sessionUser: User | null,
  skip?: number,
  take?: number
) {
  if (searchQuery.length === 0) {
    return [];
  }
  const whereQueries = getProfileWhereQueries(searchQuery, sessionUser);
  const profiles = await prismaClient.profile.findMany({
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
            },
          },
        },
      },
      offers: {
        select: {
          offer: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    where: {
      AND: whereQueries,
    },
    skip: skip,
    take: take,
    orderBy: [
      {
        score: "desc",
      },
      { updatedAt: "desc" },
      { firstName: "asc" },
    ],
  });
  return profiles;
}

export async function countSearchedProfiles(
  searchQuery: string[],
  sessionUser: User | null
) {
  if (searchQuery.length === 0) {
    return 0;
  }
  const whereQueries = getProfileWhereQueries(searchQuery, sessionUser);
  const profileCount = await prismaClient.profile.count({
    where: {
      AND: whereQueries,
    },
  });
  return profileCount;
}

function getProfileWhereQueries(
  searchQuery: string[],
  sessionUser: User | null
) {
  const whereQueries = [];
  for (const word of searchQuery) {
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
                    [K in "name" | "title"]?: {
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
          AND: [
            {
              offers: {
                some: {
                  offer: {
                    title: {
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
                    offers: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              seekings: {
                some: {
                  offer: {
                    title: {
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
                    seekings: true,
                  },
                }
              : {},
          ],
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

export async function searchOrganizationsViaLike(
  searchQuery: string[],
  sessionUser: User | null,
  skip?: number,
  take?: number
) {
  if (searchQuery.length === 0) {
    return [];
  }
  const whereQueries = getOrganizationWhereQueries(searchQuery, sessionUser);
  const organizations = await prismaClient.organization.findMany({
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
      teamMembers: {
        select: {
          profile: {
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
    where: {
      AND: whereQueries,
    },
    skip: skip,
    take: take,
    orderBy: [
      {
        score: "desc",
      },
      { updatedAt: "desc" },
      { name: "asc" },
    ],
  });
  return organizations;
}

export async function countSearchedOrganizations(
  searchQuery: string[],
  sessionUser: User | null
) {
  if (searchQuery.length === 0) {
    return 0;
  }
  const whereQueries = getOrganizationWhereQueries(searchQuery, sessionUser);
  const organizationCount = await prismaClient.organization.count({
    where: {
      AND: whereQueries,
    },
  });
  return organizationCount;
}

function getOrganizationWhereQueries(
  searchQuery: string[],
  sessionUser: User | null
) {
  const whereQueries = [];
  for (const word of searchQuery) {
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
              [K in "areas" | "types" | "focuses"]?: {
                some: {
                  [K in "area" | "organizationType" | "focus"]?: {
                    [K in "name" | "title"]?: {
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
          AND: [
            {
              focuses: {
                some: {
                  focus: {
                    title: {
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
                    focuses: true,
                  },
                }
              : {},
          ],
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
          AND: [
            {
              types: {
                some: {
                  organizationType: {
                    title: {
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
                    types: true,
                  },
                }
              : {},
          ],
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

export async function searchEventsViaLike(
  searchQuery: string[],
  sessionUser: User | null,
  skip?: number,
  take?: number
) {
  if (searchQuery.length === 0) {
    return [];
  }
  const whereQueries = getEventWhereQueries(searchQuery, sessionUser);
  const events = await prismaClient.event.findMany({
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
          title: true,
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
            },
          },
        },
      },
    },
    where: {
      AND: [{ published: true }, ...whereQueries],
    },
    skip: skip,
    take: take,
    orderBy: {
      startTime: "desc",
    },
  });
  return events;
}

export async function countSearchedEvents(
  searchQuery: string[],
  sessionUser: User | null
) {
  if (searchQuery.length === 0) {
    return 0;
  }
  const whereQueries = getEventWhereQueries(searchQuery, sessionUser);
  const eventCount = await prismaClient.event.count({
    where: {
      AND: [{ published: true }, ...whereQueries],
    },
  });
  return eventCount;
}

function getEventWhereQueries(searchQuery: string[], sessionUser: User | null) {
  const whereQueries = [];
  for (const word of searchQuery) {
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
              [K in "areas" | "types" | "focuses" | "tags" | "targetGroups"]?: {
                some: {
                  [K in
                    | "area"
                    | "eventType"
                    | "focus"
                    | "tag"
                    | "targetGroup"]?: {
                    [K in "name" | "title"]?: {
                      contains: string;
                      mode: Prisma.QueryMode;
                    };
                  };
                };
              };
            }
          | {
              [K in "experienceLevel" | "stage"]?: {
                title: {
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
          AND: [
            {
              types: {
                some: {
                  eventType: {
                    title: {
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
                    types: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              experienceLevel: {
                title: {
                  contains: word,
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
          ],
        },
        {
          AND: [
            {
              stage: {
                title: {
                  contains: word,
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
          ],
        },
        {
          AND: [
            {
              focuses: {
                some: {
                  focus: {
                    title: {
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
                    focuses: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              tags: {
                some: {
                  tag: {
                    title: {
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
                    tags: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              targetGroups: {
                some: {
                  targetGroup: {
                    title: {
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
                    targetGroups: true,
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

export async function searchProjectsViaLike(
  searchQuery: string[],
  sessionUser: User | null,
  skip?: number,
  take?: number
) {
  if (searchQuery.length === 0) {
    return [];
  }
  const whereQueries = getProjectWhereQueries(searchQuery, sessionUser);
  const projects = await prismaClient.project.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      background: true,
      excerpt: true,
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
            },
          },
        },
      },
    },
    where: {
      AND: [...whereQueries, { published: true }],
    },
    skip: skip,
    take: take,
    orderBy: {
      name: "asc",
    },
  });
  return projects;
}

export async function countSearchedProjects(
  searchQuery: string[],
  sessionUser: User | null
) {
  if (searchQuery.length === 0) {
    return 0;
  }
  const whereQueries = getProjectWhereQueries(searchQuery, sessionUser);
  const projectCount = await prismaClient.project.count({
    where: {
      AND: [...whereQueries, { published: true }],
    },
  });
  return projectCount;
}

function getProjectWhereQueries(
  searchQuery: string[],
  sessionUser: User | null
) {
  const whereQueries = [];
  for (const word of searchQuery) {
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
              [K in "awards" | "disciplines" | "targetGroups"]?: {
                some: {
                  [K in "award" | "discipline" | "targetGroup"]?: {
                    [K in "title"]?: {
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
          AND: [
            {
              awards: {
                some: {
                  award: {
                    title: {
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
                    awards: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              disciplines: {
                some: {
                  discipline: {
                    title: {
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
                    disciplines: true,
                  },
                }
              : {},
          ],
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
          AND: [
            {
              targetGroups: {
                some: {
                  targetGroup: {
                    title: {
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
                    targetGroups: true,
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
