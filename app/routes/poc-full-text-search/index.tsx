import type { LoaderFunction } from "@remix-run/node";
import { prismaClient } from "~/prisma";

export const loader: LoaderFunction = async (args) => {
  const searchQueryForFTS = "'Kontakt zu Unternehmen'"; // Mind the single quotes!
  const searchQueryForFTSMultiple = "'Kontakt zu Unternehmen' | 'Unicode'"; // Mind the single quotes!
  const searchQueryForLike = "Kontakt zu Unternehmen";
  const searchQueryForLikeMultiple = ["Kontakt zu Unternehmen", "Unicode"];

  // Prisma logging
  //prismaLog(); <-- Restart dev server to use this

  // **************
  // 1. Prismas preview feature of Postgresql Full-Text Search
  // - Performance: ~15 ms for full profile on search query 'Kontakt zu Unternehmen'
  // - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-postgres-fts
  // - Fast implemented? -> We have to write the where statement for each field on Profiles/Events, etc... -> see prismasFtsQuery()
  // - We know how it would work
  // - No substring search
  // - How to search on string arrays ? -> see profile.skills
  //const profiles = await prismasFtsQuery(searchQueryForFTS);

  // **************
  // 2. prismas like filtering with where contains
  // - Performance: ~25 ms for full profile on search query 'Kontakt zu Unternehmen'
  // - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-like
  // - Simple substring search is possibe
  // - Great writing effort with connecting search words via OR/AND -> see likeQueryMultiple()
  // - Search on arrays is possible
  const profiles = await likeQuery(searchQueryForLike);
  //const profiles = await likeQueryMultiple(searchQueryForLikeMultiple);

  // **************
  // 3. Build full text index inside schema with ts vector/ ts query
  // TODO

  // **************
  // 4. Own full text search field
  // TODO

  console.log(profiles);

  return null;
};

export default function PocFullTextSearch() {
  return <></>;
}

async function likeQuery(searchQuery: string) {
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
            contains: searchQuery,
          },
        },
        {
          offers: {
            some: {
              offer: {
                title: {
                  contains: searchQuery,
                },
              },
            },
          },
        },
        {
          username: {
            contains: searchQuery,
          },
        },
        {
          email: {
            contains: searchQuery,
          },
        },
        {
          phone: {
            contains: searchQuery,
          },
        },
        {
          website: {
            contains: searchQuery,
          },
        },
        {
          facebook: {
            contains: searchQuery,
          },
        },
        {
          linkedin: {
            contains: searchQuery,
          },
        },
        {
          twitter: {
            contains: searchQuery,
          },
        },
        {
          xing: {
            contains: searchQuery,
          },
        },
        {
          instagram: {
            contains: searchQuery,
          },
        },
        {
          youtube: {
            contains: searchQuery,
          },
        },
        {
          bio: {
            contains: searchQuery,
          },
        },
        // Outcommented for time measurement
        // {
        //   skills: {
        //     has: searchQuery,
        //   },
        // },
        // {
        //   interests: {
        //     has: searchQuery,
        //   },
        // },
        {
          academicTitle: {
            contains: searchQuery,
          },
        },
        {
          firstName: {
            contains: searchQuery,
          },
        },
        {
          lastName: {
            contains: searchQuery,
          },
        },
        {
          position: {
            contains: searchQuery,
          },
        },
        {
          areas: {
            some: {
              area: {
                name: {
                  contains: searchQuery,
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
                  contains: searchQuery,
                },
              },
            },
          },
        },
      ],
    },
  });
  console.log("\n********************************************\n");
  console.timeEnd();

  return profiles;
}

async function likeQueryMultiple(searchQueries: string[]) {
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
            contains: searchQueries[0],
          },
        },
        {
          firstName: {
            contains: searchQueries[1],
          },
        },
        // And so on ... (for each query word a new where object. And that for each field that is searched on the entity.)
      ],
    },
  });
  console.log("\n********************************************\n");
  console.timeEnd();

  return profiles;
}

async function prismasFtsQuery(searchQuery: string) {
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
        // Not supported ? Sting Arrays
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
  console.log("\n********************************************\n");
  console.timeEnd();

  return profiles;
}

function prismaLog() {
  prismaClient.$on("query", (e) => {
    console.log("Query: " + e.query);
    console.log("Params: " + e.params);
    console.log("Duration: " + e.duration + "ms");
  });
}
