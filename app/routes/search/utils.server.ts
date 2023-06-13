import type {
  Event,
  Organization,
  Prisma,
  Profile,
  Project,
} from "@prisma/client";
import { prismaClient } from "~/prisma";

// **************
// Prismas like filtering with where contains
// - Performance: ~30 ms for full profile on search query 'Kontakt zu Unternehmen'
// - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-like
// - Fast implemented -> We have to write the where statement for each field on Profiles/Events, etc... -> see likeQueryMultiple()
// - Simple substring search is possibe
// - How to sort by relevance?
// - Search on arrays is possible
// - Search on relations is possible
// - Case sensitive!

export async function searchProfilesViaLike(
  searchQuery: string[],
  skip?: number,
  take?: number
) {
  if (searchQuery.length === 0) {
    return [];
  }
  const whereQueries = getProfileWhereQueries(searchQuery);
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
      areas: {
        select: {
          area: {
            select: {
              name: true,
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

export async function countSearchedProfiles(searchQuery: string[]) {
  if (searchQuery.length === 0) {
    return 0;
  }
  const whereQueries = getProfileWhereQueries(searchQuery);
  const profileCount = await prismaClient.profile.count({
    where: {
      AND: whereQueries,
    },
  });
  return profileCount;
}

function getProfileWhereQueries(searchQuery: string[]) {
  let whereQueries = [];
  for (const word of searchQuery) {
    const contains: {
      OR: (
        | {
            [K in Profile as string]: {
              contains: string;
              mode: Prisma.QueryMode;
            };
          }
        | {
            [K in
              | "areas"
              | "memberOf"
              | "offers"
              | "seekings"
              | "teamMemberOfProjects"]?: {
              some: {
                [K in "area" | "organization" | "offer" | "project"]?: {
                  [K in "name" | "title"]?: {
                    contains: string;
                    mode: Prisma.QueryMode;
                  };
                };
              };
            };
          }
        | {
            [K in "skills" | "interests"]?: {
              has: string;
            };
          }
      )[];
    } = {
      OR: [
        {
          username: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          bio: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          skills: {
            has: word,
          },
        },
        {
          interests: {
            has: word,
          },
        },
        {
          firstName: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          position: {
            contains: word,
            mode: "insensitive",
          },
        },
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
        {
          memberOf: {
            some: {
              organization: {
                name: {
                  contains: word,
                  mode: "insensitive",
                },
              },
            },
          },
        },
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
        {
          teamMemberOfProjects: {
            some: {
              project: {
                name: {
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

export async function searchOrganizationsViaLike(
  searchQuery: string[],
  skip?: number,
  take?: number
) {
  if (searchQuery.length === 0) {
    return [];
  }
  const whereQueries = getOrganizationWhereQueries(searchQuery);
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
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

export async function countSearchedOrganizations(searchQuery: string[]) {
  if (searchQuery.length === 0) {
    return 0;
  }
  const whereQueries = getOrganizationWhereQueries(searchQuery);
  const organizationCount = await prismaClient.organization.count({
    where: {
      AND: whereQueries,
    },
  });
  return organizationCount;
}

function getOrganizationWhereQueries(searchQuery: string[]) {
  let whereQueries = [];
  for (const word of searchQuery) {
    const contains: {
      OR: (
        | {
            [K in Organization as string]: {
              contains: string;
              mode: Prisma.QueryMode;
            };
          }
        | {
            [K in
              | "areas"
              | "types"
              | "focuses"
              | "networkMembers"
              | "memberOf"
              | "teamMembers"
              | "responsibleForProject"]?: {
              some: {
                [K in
                  | "area"
                  | "organizationType"
                  | "focus"
                  | "networkMember"
                  | "network"
                  | "profile"
                  | "project"]?: {
                  [K in "name" | "title" | "firstName" | "lastName"]?: {
                    contains: string;
                    mode: Prisma.QueryMode;
                  };
                };
              };
            };
          }
        | {
            supportedBy: {
              has: string;
            };
          }
      )[];
    } = {
      OR: [
        {
          name: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          slug: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          street: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          city: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          bio: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          supportedBy: {
            has: word,
          },
        },
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
        {
          networkMembers: {
            some: {
              networkMember: {
                name: {
                  contains: word,
                  mode: "insensitive",
                },
              },
            },
          },
        },
        {
          memberOf: {
            some: {
              network: {
                name: {
                  contains: word,
                  mode: "insensitive",
                },
              },
            },
          },
        },
        {
          teamMembers: {
            some: {
              profile: {
                firstName: {
                  contains: word,
                  mode: "insensitive",
                },
              },
            },
          },
        },
        {
          teamMembers: {
            some: {
              profile: {
                lastName: {
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
              organizationType: {
                title: {
                  contains: word,
                  mode: "insensitive",
                },
              },
            },
          },
        },
        {
          responsibleForProject: {
            some: {
              project: {
                name: {
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

export async function searchEventsViaLike(
  searchQuery: string[],
  skip?: number,
  take?: number
) {
  if (searchQuery.length === 0) {
    return [];
  }
  const whereQueries = getEventWhereQueries(searchQuery);
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

export async function countSearchedEvents(searchQuery: string[]) {
  if (searchQuery.length === 0) {
    return 0;
  }
  const whereQueries = getEventWhereQueries(searchQuery);
  const eventCount = await prismaClient.event.count({
    where: {
      AND: [{ published: true }, ...whereQueries],
    },
  });
  return eventCount;
}

function getEventWhereQueries(searchQuery: string[]) {
  let whereQueries = [];
  for (const word of searchQuery) {
    const contains: {
      OR: (
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
      )[];
    } = {
      OR: [
        {
          name: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          slug: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          venueName: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          venueStreet: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          venueStreetNumber: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          venueCity: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          subline: {
            contains: word,
            mode: "insensitive",
          },
        },
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
        {
          experienceLevel: {
            title: {
              contains: word,
              mode: "insensitive",
            },
          },
        },
        {
          stage: {
            title: {
              contains: word,
              mode: "insensitive",
            },
          },
        },
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
      ],
    };
    whereQueries.push(contains);
  }
  return whereQueries;
}

export async function searchProjectsViaLike(
  searchQuery: string[],
  skip?: number,
  take?: number
) {
  if (searchQuery.length === 0) {
    return [];
  }
  const whereQueries = getProjectWhereQueries(searchQuery);
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
              name: true,
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
    orderBy: {
      name: "asc",
    },
  });
  return projects;
}

export async function countSearchedProjects(searchQuery: string[]) {
  if (searchQuery.length === 0) {
    return 0;
  }
  const whereQueries = getProjectWhereQueries(searchQuery);
  const projectCount = await prismaClient.project.count({
    where: {
      AND: whereQueries,
    },
  });
  return projectCount;
}

function getProjectWhereQueries(searchQuery: string[]) {
  let whereQueries = [];
  for (const word of searchQuery) {
    const contains: {
      OR: (
        | {
            [K in Project as string]: {
              contains: string;
              mode: Prisma.QueryMode;
            };
          }
        | {
            [K in
              | "awards"
              | "disciplines"
              | "responsibleOrganizations"
              | "targetGroups"
              | "teamMembers"]?: {
              some: {
                [K in
                  | "award"
                  | "discipline"
                  | "organization"
                  | "targetGroup"
                  | "profile"]?: {
                  [K in "name" | "title" | "firstName" | "lastName"]?: {
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
          name: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          slug: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          headline: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          excerpt: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          city: {
            contains: word,
            mode: "insensitive",
          },
        },
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
        {
          responsibleOrganizations: {
            some: {
              organization: {
                name: {
                  contains: word,
                  mode: "insensitive",
                },
              },
            },
          },
        },
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
        {
          teamMembers: {
            some: {
              profile: {
                firstName: {
                  contains: word,
                  mode: "insensitive",
                },
              },
            },
          },
        },
        {
          teamMembers: {
            some: {
              profile: {
                lastName: {
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
export function prismaLog() {
  prismaClient.$on("query", (e) => {
    console.log("Query: " + e.query);
    console.log("Params: " + e.params);
    console.log("Duration: " + e.duration + "ms");
  });
}
