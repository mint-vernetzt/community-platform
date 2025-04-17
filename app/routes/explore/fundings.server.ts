import { type supportedCookieLanguages } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { type GetFundingsSchema } from "./fundings";
import { type Prisma } from "@prisma/client";
import { type User } from "@supabase/supabase-js";
import { type GetSearchSchema } from "./index";

export type ExploreFundingsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["explore/fundings"];

export function getKeys(key: FilterKey) {
  let singularKey;
  let pluralKey;

  if (key === "types" || key === "areas" || key === "regions") {
    singularKey = key.slice(0, -1);
    pluralKey = key;
  } else {
    singularKey = "entity";
    pluralKey = "eligibleEntities";
  }

  return { singularKey, pluralKey };
}

export function getTakeParam(page: GetFundingsSchema["fndPage"]) {
  const itemsPerPage = 12;
  const take = itemsPerPage * page;
  return take;
}

type FilterKey = keyof GetFundingsSchema["fndFilter"];

type FilterKeyWhereStatement = {
  OR: { [x: string]: { some: { [x: string]: { slug: string } } } }[];
};
type SearchWhereStatement = {
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
};
type WhereClause = {
  AND: FilterKeyWhereStatement[] & SearchWhereStatement[];
};

function getFundingsFilterWhereClause(filter: GetFundingsSchema["fndFilter"]) {
  const whereClauses: WhereClause = { AND: [] };
  for (const key in filter) {
    const typedKey = key as FilterKey;

    const { singularKey, pluralKey } = getKeys(typedKey);

    const values = filter[typedKey];
    if (values.length === 0) {
      continue;
    }

    const filterKeyWhereStatement: {
      OR: { [x: string]: { some: { [x: string]: { slug: string } } } }[];
    } = { OR: [] };

    for (const value of values) {
      const whereStatement = {
        [pluralKey]: {
          some: {
            [typedKey === "regions" ? "area" : singularKey]: {
              // funding data for areas is stored in regions
              slug: value,
            },
          },
        },
      };
      filterKeyWhereStatement.OR.push(whereStatement);
    }

    whereClauses.AND.push(filterKeyWhereStatement);
  }

  return whereClauses;
}

function getFundingsSearchWhereClause(
  words: string[]
  // sessionUser: User | null,
  // language: ArrayElement<typeof supportedCookieLanguages>
) {
  const whereClauses = [];
  for (const word of words) {
    const contains: SearchWhereStatement = {
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
    whereClauses.push(contains);
  }
  return whereClauses;
}

export async function getFundingIds(options: {
  filter: GetFundingsSchema["fndFilter"];
  search: GetSearchSchema["search"];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const filterWhereClause = getFundingsFilterWhereClause(options.filter);
  const searchWhereClauses = getFundingsSearchWhereClause(options.search);

  filterWhereClause.AND.push(...searchWhereClauses);
  const whereClause = filterWhereClause;

  const fundingIds = await prismaClient.funding.findMany({
    where: whereClause,
    select: {
      id: true,
    },
  });
  const ids = fundingIds.map((funding) => {
    return funding.id;
  });
  return ids;
}

export async function updateFilterVectorOfFunding(fundingId: string) {
  const funding = await prismaClient.funding.findFirst({
    where: { id: fundingId },
    select: {
      id: true,
      types: {
        select: {
          type: {
            select: {
              slug: true,
            },
          },
        },
      },
      regions: {
        select: {
          area: {
            select: {
              slug: true,
            },
          },
        },
      },
      areas: {
        select: {
          area: {
            select: {
              slug: true,
            },
          },
        },
      },
      eligibleEntities: {
        select: {
          entity: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });
  if (funding !== null) {
    if (
      funding.types.length === 0 &&
      funding.regions.length === 0 &&
      funding.areas.length === 0 &&
      funding.eligibleEntities.length === 0
    ) {
      await prismaClient.$queryRawUnsafe(
        `update profiles set filter_vector = NULL where id = '${funding.id}'`
      );
    } else {
      const { singularKey: typeKey } = getKeys("types");
      const typeVectors = funding.types.map(
        (relation) => `${typeKey}:${relation.type.slug}`
      );
      const { singularKey: regionKey } = getKeys("regions");
      const regionVectors = funding.regions.map(
        (relation) => `${regionKey}:${relation.area.slug}`
      );
      const { singularKey: areaKey } = getKeys("areas");
      const areaVectors = funding.areas.map(
        (relation) => `${areaKey}:${relation.area.slug}`
      );
      const { singularKey: entityKey } = getKeys("eligibleEntities");
      const eligibleEntityVectors = funding.eligibleEntities.map(
        (relation) => `${entityKey}:${relation.entity.slug}`
      );
      const vectors = [
        ...typeVectors,
        ...regionVectors,
        ...areaVectors,
        ...eligibleEntityVectors,
      ];
      const vectorString = `{"${vectors.join(`","`)}"}`;
      const query = `update fundings set filter_vector = array_to_tsvector('${vectorString}') where id = '${funding.id}'`;
      await prismaClient.$queryRawUnsafe(query);
    }
  }
}

export async function getAllFundings(options: {
  filter: GetFundingsSchema["fndFilter"];
  sortBy: GetFundingsSchema["fndSortBy"];
  take: ReturnType<typeof getTakeParam>;
  search: GetSearchSchema["search"];
  sessionUser: User | null;
  language: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const whereClauses = getFundingsFilterWhereClause(options.filter);
  const searchWhereClauses = getFundingsSearchWhereClause(options.search);
  whereClauses.AND.push(...searchWhereClauses);

  const fundings = await prismaClient.funding.findMany({
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
      AND: whereClauses,
    },
    take: options.take,
    orderBy: [
      {
        [options.sortBy.value]: options.sortBy.direction,
      },
      {
        id: "asc",
      },
    ],
  });

  return fundings;
}

export async function getFundingFilterVectorForAttribute(options: {
  attribute: keyof GetFundingsSchema["fndFilter"];
  filter: GetFundingsSchema["fndFilter"];
  search: GetSearchSchema["search"];
  ids: string[];
}) {
  const { attribute, filter, ids } = options;
  let whereClause = "";
  const whereStatements = [];
  const filterKeys = Object.keys(filter) as (keyof typeof filter)[];
  for (const filterKey of filterKeys) {
    const filterValues = filter[filterKey];

    if (filterKey === attribute) {
      continue;
    }

    if (filterValues.length === 0) {
      continue;
    }
    let tableKey;

    if (filterKey === "types") {
      tableKey = "fundingType";
    } else if (filterKey === "regions") {
      tableKey = "area";
    } else if (filterKey === "areas") {
      tableKey = "fundingArea";
    } else {
      tableKey = "fundingEligibleEntity";
    }

    let allPossibleFilterValues;
    try {
      allPossibleFilterValues = await prismaClient[tableKey as "area"].findMany(
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
      const { singularKey: key } = getKeys(filterKey);
      const tuple = `${key}\\:${slug}`;
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
      FROM fundings
      ${whereClause}
    $$)
    GROUP BY attr;
    `);

  return filterVector;
}

export function getFilterCountForSlug(
  // TODO: Remove '| null' when slug isn't optional anymore (after migration)
  slug: string | null,
  filterVector: Awaited<ReturnType<typeof getFundingFilterVectorForAttribute>>,
  attribute: ArrayElement<
    Awaited<ReturnType<typeof getFundingFilterVectorForAttribute>>
  >["attr"]
) {
  const { singularKey: key } = getKeys(attribute);

  const filterKeyVector = filterVector.find((vector) => {
    return vector.attr === key;
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
