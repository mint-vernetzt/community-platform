import { type supportedCookieLanguages } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { type FilterKey, type GetFundingsSchema } from "./fundings";

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

export async function getFundingFilterVectorForAttribute(
  attribute: keyof GetFundingsSchema["filter"],
  filter: GetFundingsSchema["filter"]
) {
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
