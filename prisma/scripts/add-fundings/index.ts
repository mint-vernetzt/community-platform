import { program } from "commander";
import { z } from "zod";
import fs from "fs-extra";
import { prismaClient } from "~/prisma.server";
import { generateValidSlug } from "~/utils.server";
import { updateFilterVectorOfFunding } from "~/routes/explore/fundings.server";

program.requiredOption(
  "-f, --file <file>",
  "The file that contains the fundings."
);
program.option("--overwrite", "Overwrite existing fundings.", false);

program.parse(process.argv);

const options = program.opts();

const schema = z.array(
  z.object({
    url: z.string().url(),
    title: z.string(),
    mapping: z.object({
      funder: z.array(z.string()),
      fundingType: z.array(z.string()),
      fundingRegion: z.array(z.string()),
      fundingArea: z.array(z.string()),
      eligibleEntities: z.array(z.string()),
    }),
    source: z.object({
      funder: z.array(z.string()),
      fundingType: z.array(z.string()),
      fundingRegion: z.array(z.string()),
      fundingArea: z.array(z.string()),
      eligibleEntities: z.array(z.string()),
    }),
    createdAt: z.coerce.date(),
  })
);

type Funding = z.infer<typeof schema>[0];

async function main() {
  // eslint-disable-next-line import/no-named-as-default-member
  let data = await fs.readJson(options.file);

  if (options.overwrite) {
    console.log("Overwriting all fundings.");
    await prismaClient.funding.deleteMany();
  }

  const parsedData = schema.safeParse(data);

  let fundings: Funding[];

  if (parsedData.success === false) {
    const issueIndexes = parsedData.error.errors.map((issue) => {
      console.log(
        `Found issue: "${issue.message}" at "${data[issue.path[0]].title}"`
      );
      return issue.path[0];
    });

    if (Array.isArray(data)) {
      data = data.filter((_, index) => {
        return issueIndexes.includes(index) === false;
      });
    } else {
      throw new Error("Data has wrong format.");
    }

    fundings = schema.parse(data);
  } else {
    fundings = parsedData.data;
  }

  console.log(`Adding ${fundings.length} fundings from ${options.file}.`);

  const funders: string[] = [];
  const fundingTypes: string[] = [];
  const fundingAreas: string[] = [];
  const eligibleEntities: string[] = [];
  const fundingRegions: string[] = [];
  for (const funding of fundings) {
    if (
      funding.mapping.funder.length === 0 &&
      funders.includes("ohne Kategorie") === false
    ) {
      funders.push("ohne Kategorie");
    }
    for (const funder of funding.mapping.funder) {
      if (funders.includes(funder) === false) {
        funders.push(funder);
      }
    }
    if (
      funding.mapping.fundingType.length === 0 &&
      fundingTypes.includes("ohne Kategorie") === false
    ) {
      fundingTypes.push("ohne Kategorie");
    }
    for (const type of funding.mapping.fundingType) {
      if (fundingTypes.includes(type) === false) {
        fundingTypes.push(type);
      }
    }
    if (
      funding.mapping.fundingArea.length === 0 &&
      fundingAreas.includes("ohne Kategorie") === false
    ) {
      fundingAreas.push("ohne Kategorie");
    }
    for (const area of funding.mapping.fundingArea) {
      if (fundingAreas.includes(area) === false) {
        fundingAreas.push(area);
      }
    }
    if (
      funding.mapping.eligibleEntities.length === 0 &&
      eligibleEntities.includes("ohne Kategorie") === false
    ) {
      eligibleEntities.push("ohne Kategorie");
    }
    for (const entity of funding.mapping.eligibleEntities) {
      if (eligibleEntities.includes(entity) === false) {
        eligibleEntities.push(entity);
      }
    }
    if (
      funding.mapping.fundingRegion.length === 0 &&
      fundingRegions.includes("ohne Kategorie") === false
    ) {
      fundingRegions.push("ohne Kategorie");
    }
    for (const region of funding.mapping.fundingRegion) {
      if (fundingRegions.includes(region) === false) {
        fundingRegions.push(region);
      }
    }
  }

  await prismaClient.funder.createMany({
    data: funders.map((funder) => {
      const slug = generateValidSlug(funder, {
        hashFunction: (str) => str,
      });
      return {
        slug,
        title: funder,
      };
    }),
    skipDuplicates: true,
  });
  await prismaClient.fundingType.createMany({
    data: fundingTypes.map((type) => {
      const slug = generateValidSlug(type, {
        hashFunction: (str) => str,
      });

      return {
        slug,
        title: type,
      };
    }),
    skipDuplicates: true,
  });
  await prismaClient.fundingArea.createMany({
    data: fundingAreas.map((area) => {
      const slug = generateValidSlug(area, {
        hashFunction: (str) => str,
      });
      return {
        slug,
        title: area,
      };
    }),
    skipDuplicates: true,
  });
  await prismaClient.fundingEligibleEntity.createMany({
    data: eligibleEntities.map((entity) => {
      const slug = generateValidSlug(entity, {
        hashFunction: (str) => str,
      });
      return {
        slug,
        title: entity,
      };
    }),
    skipDuplicates: true,
  });
  await prismaClient.fundingRegion.createMany({
    data: fundingRegions.map((region) => {
      const slug = generateValidSlug(region, {
        hashFunction: (str) => str,
      });
      return {
        slug,
        title: region,
      };
    }),
    skipDuplicates: true,
  });

  for await (const funding of fundings) {
    const existingFunding = await prismaClient.funding.count({
      where: {
        url: funding.url,
      },
    });

    if (existingFunding > 0) {
      console.log(
        `Funding with url "${funding.url}" already exists. Skipping.`
      );
      continue;
    }

    const result = await prismaClient.funding.create({
      data: {
        url: funding.url,
        title: funding.title,
        sourceFunders: funding.source.funder,
        sourceTypes: funding.source.fundingType,
        sourceRegions: funding.source.fundingRegion,
        sourceAreas: funding.source.fundingArea,
        sourceEntities: funding.source.eligibleEntities,
        createdAt: funding.createdAt,
      },
    });

    const funders =
      funding.mapping.funder.length > 0
        ? await prismaClient.funder.findMany({
            where: {
              title: {
                in: funding.mapping.funder,
              },
            },
          })
        : await prismaClient.funder.findMany({
            where: {
              title: "ohne Kategorie",
            },
          });
    const fundingTypes =
      funding.mapping.fundingType.length > 0
        ? await prismaClient.fundingType.findMany({
            where: {
              title: {
                in: funding.mapping.fundingType,
              },
            },
          })
        : await prismaClient.fundingType.findMany({
            where: {
              title: "ohne Kategorie",
            },
          });
    const fundingAreas =
      funding.mapping.fundingArea.length > 0
        ? await prismaClient.fundingArea.findMany({
            where: {
              title: {
                in: funding.mapping.fundingArea,
              },
            },
          })
        : await prismaClient.fundingArea.findMany({
            where: {
              title: "ohne Kategorie",
            },
          });
    const eligibleEntities =
      funding.mapping.eligibleEntities.length > 0
        ? await prismaClient.fundingEligibleEntity.findMany({
            where: {
              title: {
                in: funding.mapping.eligibleEntities,
              },
            },
          })
        : await prismaClient.fundingEligibleEntity.findMany({
            where: {
              title: "ohne Kategorie",
            },
          });
    const regions =
      funding.mapping.fundingRegion.length > 0
        ? await prismaClient.fundingRegion.findMany({
            where: {
              title: {
                in: funding.mapping.fundingRegion,
              },
            },
          })
        : await prismaClient.fundingRegion.findMany({
            where: {
              title: "ohne Kategorie",
            },
          });

    await prismaClient.funding.update({
      where: {
        id: result.id,
      },
      data: {
        funders: {
          connectOrCreate: funders.map((funder) => {
            return {
              where: {
                fundingId_funderId: {
                  funderId: funder.id,
                  fundingId: result.id,
                },
              },
              create: {
                funderId: funder.id,
              },
            };
          }),
        },
        types: {
          connectOrCreate: fundingTypes.map((type) => {
            return {
              where: {
                fundingId_typeId: {
                  typeId: type.id,
                  fundingId: result.id,
                },
              },
              create: {
                typeId: type.id,
              },
            };
          }),
        },
        areas: {
          connectOrCreate: fundingAreas.map((area) => {
            return {
              where: {
                fundingId_areaId: {
                  areaId: area.id,
                  fundingId: result.id,
                },
              },
              create: {
                areaId: area.id,
              },
            };
          }),
        },
        eligibleEntities: {
          connectOrCreate: eligibleEntities.map((entity) => {
            return {
              where: {
                fundingId_entityId: {
                  entityId: entity.id,
                  fundingId: result.id,
                },
              },
              create: {
                entityId: entity.id,
              },
            };
          }),
        },
        regions: {
          connectOrCreate: regions.map((region) => {
            return {
              where: {
                fundingId_regionId: {
                  regionId: region.id,
                  fundingId: result.id,
                },
              },
              create: {
                regionId: region.id,
              },
            };
          }),
        },
      },
    });

    await updateFilterVectorOfFunding(result.id);
  }
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
