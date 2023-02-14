import type { LoaderFunction } from "@remix-run/node";
import { prismaClient } from "~/prisma";

export const loader: LoaderFunction = async (args) => {
  const searchQueryForFTS = "'Unicode'"; // Mind the single quotes!
  const searchQueryForFTSMultiple = "'Kontakt' | 'zu' | 'Unternehmen'"; // Mind the single quotes!
  const searchQueryForLike = "Unicode";
  const searchQueryForLikeMultiple = ["Kontakt", "zu", "Unternehmen"];

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
  //const profiles = await likeQuery(searchQueryForLike);
  const profiles = await likeQueryMultiple(searchQueryForLikeMultiple);

  // **************
  // 3. Build full text index inside schema with ts vector/ ts query
  // TODO

  // **************
  // 4. Own full text search field
  // TODO

  console.log(profiles);

  return null;
};

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
          bio: {
            contains: searchQuery,
          },
        },
        {
          skills: {
            has: searchQuery,
          },
        },
        {
          interests: {
            has: searchQuery,
          },
        },
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
  let whereQueries = [];
  for (const query of searchQueries) {
    const contains = [
      {
        firstName: {
          contains: query,
        },
      },
      {
        offers: {
          some: {
            offer: {
              title: {
                contains: query,
              },
            },
          },
        },
      },
      {
        username: {
          contains: query,
        },
      },
      {
        email: {
          contains: query,
        },
      },
      {
        phone: {
          contains: query,
        },
      },
      {
        website: {
          contains: query,
        },
      },
      {
        bio: {
          contains: query,
        },
      },
      {
        skills: {
          has: query,
        },
      },
      {
        interests: {
          has: query,
        },
      },
      {
        academicTitle: {
          contains: query,
        },
      },
      {
        firstName: {
          contains: query,
        },
      },
      {
        lastName: {
          contains: query,
        },
      },
      {
        position: {
          contains: query,
        },
      },
      {
        areas: {
          some: {
            area: {
              name: {
                contains: query,
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
                contains: query,
              },
            },
          },
        },
      },
    ];
    whereQueries = [...whereQueries, ...contains];
  }
  const profiles = await prismaClient.profile.findMany({
    select: {
      firstName: true,
      email: true,
    },
    where: {
      OR: whereQueries,
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

export default function PocFullTextSearch() {
  return <></>;
}
