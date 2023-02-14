import type { LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prismaClient } from "~/prisma";

export const loader = async (args: LoaderArgs) => {
  const searchQueryForFTS = "'Unicode'"; // Mind the single quotes!
  const searchQueryForFTSMultiple = "'Kontakt' | 'zu' | 'Unternehmen'"; // Mind the single quotes!
  const searchQueryForLike = "Unicode";
  const searchQueryForLikeMultiple = ["Kontakt", "zu", "Unternehmen"];

  console.time("Overall time");

  // Prisma logging
  //prismaLog(); // <-- Restart dev server to use this

  // **************
  // 1. Prismas preview feature of Postgresql Full-Text Search
  // - Performance: ~15 ms for full profile on search query 'Kontakt zu Unternehmen'
  // - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-postgres-fts
  // - Fast implemented -> We have to write the where statement for each field on Profiles/Events, etc... -> see prismasFtsQuery()
  // - No substring search
  // - How to search on string arrays ? -> see profile.skills
  //const profiles = await prismasFtsQuery(searchQueryForFTS);
  //const profiles = await prismasFtsQuery(searchQueryForFTSMultiple);

  // **************
  // 2. prismas like filtering with where contains
  // - Performance: ~30 ms for full profile on search query 'Kontakt zu Unternehmen'
  // - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-like
  // - Fast implemented -> We have to write the where statement for each field on Profiles/Events, etc... -> see likeQueryMultiple()
  // - Simple substring search is possibe
  // - How to sort by relevance?
  // - Search on arrays is possible
  // - Search on relations is possible
  // - Case sensitive!
  const profiles = await searchProfilesViaLike(searchQueryForLikeMultiple);
  const organizations = await searchOrganizationsViaLike(
    searchQueryForLikeMultiple
  );
  const events = await searchEventsViaLike(searchQueryForLikeMultiple);
  const projects = await searchProjectsViaLike(searchQueryForLikeMultiple);

  // **************
  // 3. Build full text index inside schema with ts vector/ ts query

  // **************
  // 4. Own full text search field
  // TODO

  // **************
  // 5. Creating a postgres view
  //const profiles = await createPostgresView();

  //console.log(profiles);

  console.log("\n-------------------------------------------\n");
  console.timeEnd("Overall time");
  console.log("\n-------------------------------------------\n");

  return { profiles, organizations, events, projects };
};

async function searchProfilesViaLike(searchQuery: string[]) {
  if (searchQuery.length === 0) {
    return [];
  }
  console.log("\n********************************************\n");
  console.time("Profiles");
  let whereQueries = [];
  for (const word of searchQuery) {
    const contains = {
      OR: [
        {
          firstName: {
            contains: word,
          },
        },
        {
          username: {
            contains: word,
          },
        },
        {
          email: {
            contains: word,
          },
        },
        {
          phone: {
            contains: word,
          },
        },
        {
          website: {
            contains: word,
          },
        },
        {
          bio: {
            contains: word,
          },
        },
        {
          academicTitle: {
            contains: word,
          },
        },
        {
          firstName: {
            contains: word,
          },
        },
        {
          lastName: {
            contains: word,
          },
        },
        {
          position: {
            contains: word,
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
          areas: {
            some: {
              area: {
                name: {
                  contains: word,
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
                },
              },
            },
          },
        },
      ],
    };
    whereQueries.push(contains);
  }
  const profiles = await prismaClient.profile.findMany({
    select: {
      id: true,
      publicFields: true,
      academicTitle: true,
      firstName: true,
      lastName: true,
      username: true,
      bio: true,
      avatar: true,
      position: true,
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
    // Pagination boosts performance
    skip: 0,
    take: 6,
  });
  console.timeEnd("Profiles");
  console.log("\n********************************************\n");

  return profiles;
}

async function searchOrganizationsViaLike(searchQuery: string[]) {
  if (searchQuery.length === 0) {
    return [];
  }
  console.log("\n********************************************\n");
  console.time("Organizations");
  let whereQueries = [];
  for (const word of searchQuery) {
    const contains = {
      OR: [
        {
          name: {
            contains: word,
          },
        },
        {
          slug: {
            contains: word,
          },
        },
        {
          email: {
            contains: word,
          },
        },
        {
          phone: {
            contains: word,
          },
        },
        {
          street: {
            contains: word,
          },
        },
        {
          city: {
            contains: word,
          },
        },
        {
          website: {
            contains: word,
          },
        },
        {
          bio: {
            contains: word,
          },
        },
        {
          streetNumber: {
            contains: word,
          },
        },
        {
          zipCode: {
            contains: word,
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
                },
              },
            },
          },
        },
      ],
    };
    whereQueries.push(contains);
  }
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      publicFields: true,
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
    // Pagination boosts performance
    skip: 0,
    take: 6,
  });
  console.timeEnd("Organizations");
  console.log("\n********************************************\n");

  return organizations;
}

async function searchEventsViaLike(searchQuery: string[]) {
  if (searchQuery.length === 0) {
    return [];
  }
  console.log("\n********************************************\n");
  console.time("Events");
  let whereQueries = [];
  for (const word of searchQuery) {
    const contains = {
      OR: [
        {
          name: {
            contains: word,
          },
        },
        {
          slug: {
            contains: word,
          },
        },
        {
          description: {
            contains: word,
          },
        },
        {
          venueName: {
            contains: word,
          },
        },
        {
          venueStreet: {
            contains: word,
          },
        },
        {
          venueStreetNumber: {
            contains: word,
          },
        },
        {
          venueCity: {
            contains: word,
          },
        },
        {
          venueZipCode: {
            contains: word,
          },
        },
        {
          subline: {
            contains: word,
          },
        },
        {
          areas: {
            some: {
              area: {
                name: {
                  contains: word,
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
                },
              },
            },
          },
        },
        {
          experienceLevel: {
            title: {
              contains: word,
            },
          },
        },
        {
          stage: {
            title: {
              contains: word,
            },
          },
        },
        {
          focuses: {
            some: {
              focus: {
                title: {
                  contains: word,
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
                },
              },
            },
          },
        },
      ],
    };
    whereQueries.push(contains);
  }
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
    // Pagination boosts performance
    skip: 0,
    take: 6,
  });
  console.timeEnd("Events");
  console.log("\n********************************************\n");

  return events;
}

async function searchProjectsViaLike(searchQuery: string[]) {
  if (searchQuery.length === 0) {
    return [];
  }
  console.log("\n********************************************\n");
  console.time("Projects");
  let whereQueries = [];
  for (const word of searchQuery) {
    const contains = {
      OR: [
        {
          name: {
            contains: word,
          },
        },
        {
          slug: {
            contains: word,
          },
        },
        {
          headline: {
            contains: word,
          },
        },
        {
          excerpt: {
            contains: word,
          },
        },
        {
          description: {
            contains: word,
          },
        },
        {
          email: {
            contains: word,
          },
        },
        {
          phone: {
            contains: word,
          },
        },
        {
          website: {
            contains: word,
          },
        },
        {
          street: {
            contains: word,
          },
        },
        {
          streetNumber: {
            contains: word,
          },
        },
        {
          zipCode: {
            contains: word,
          },
        },
        {
          city: {
            contains: word,
          },
        },
        {
          awards: {
            some: {
              award: {
                title: {
                  contains: word,
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
                },
              },
            },
          },
        },
      ],
    };
    whereQueries.push(contains);
  }
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
    // Pagination boosts performance
    skip: 0,
    take: 6,
  });
  console.timeEnd("Projects");
  console.log("\n********************************************\n");

  return projects;
}

async function prismasFtsQuery(searchQuery: string) {
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

function prismaLog() {
  prismaClient.$on("query", (e) => {
    console.log("Query: " + e.query);
    console.log("Params: " + e.params);
    console.log("Duration: " + e.duration + "ms");
  });
}

export default function PocFullTextSearch() {
  const loaderData = useLoaderData<typeof loader>();
  return <></>;
}
