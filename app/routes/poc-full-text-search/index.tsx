import type { LoaderFunction } from "@remix-run/node";
import { prismaClient } from "~/prisma";

export const loader: LoaderFunction = async (args) => {
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

  const profiles = await searchProfilesViaLike(searchQueryForLikeMultiple);
  const organizations = await searchOrganizationsViaLike(
    searchQueryForLikeMultiple
  );

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

  return null;
};

async function searchProfilesViaLike(searchQuery: string[]) {
  if (searchQuery.length === 0) {
    return [];
  }
  console.log("\n********************************************\n");
  console.time();
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
  });
  console.timeEnd();
  console.log("\n********************************************\n");

  return profiles;
}

async function searchOrganizationsViaLike(searchQuery: string[]) {
  if (searchQuery.length === 0) {
    return [];
  }
  console.log("\n********************************************\n");
  console.time();
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
  });
  console.timeEnd();
  console.log("\n********************************************\n");

  return organizations;
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
  return <></>;
}
