import { prismaClient } from "../../../app/prisma";
import organizationTypes from "./data/organizationTypes.json";
import targetGroups from "./data/targetGroups.json";
import offers from "./data/offers.json";
import focuses from "./data/focuses.json";
import {
  dataToBeUpdated,
  entriesOnlyExistingOnDatabase,
  filterMissingData,
  GenericEntry,
} from "./src/utils";

type TableName = "offer" | "organizationType" | "focus" | "targetGroup";

async function createDataset(datasets: GenericEntry[], tableName: TableName) {
  console.log(`create entries for ${tableName}`);

  // @ts-ignore
  const existingEntries = await prismaClient[tableName].findMany();
  const missingData = filterMissingData(datasets, existingEntries);

  if (missingData.length > 0) {
    await prismaClient[tableName].createMany({ data: missingData });
    console.log(`added entry to ${tableName}: `, missingData);
  }

  const entriesToUpdate = dataToBeUpdated(datasets, existingEntries);
  if (entriesToUpdate.length > 0) {
    entriesToUpdate.forEach(async ({ id, ...rest }) => {
      // @ts-ignore
      await prismaClient[tableName].update({
        where: {
          id,
        },
        data: {
          ...rest,
        },
      });
    });

    console.log(`updated entries in ${tableName}: `, entriesToUpdate);
  }

  const unknownEntries = entriesOnlyExistingOnDatabase(
    datasets,
    existingEntries
  );
  if (unknownEntries.length > 0) {
    console.log(`warning, unknown "${tableName}s" in db: `, unknownEntries);
  }

  if (missingData.length === 0 && entriesToUpdate.length === 0) {
    console.log(`table ${tableName} is up to date`);
  }
}

const datasets = [
  { tableName: "offer", data: offers },
  { tableName: "organizationType", data: organizationTypes },
  { tableName: "focus", data: focuses },
  { tableName: "targetGroup", data: targetGroups },
];

Promise.all(
  datasets.map(
    (dataset) =>
      new Promise((resolve) => {
        createDataset(dataset.data, dataset.tableName as TableName).then(
          resolve
        );
      })
  )
)
  .catch((e) => {
    throw e;
  })
  .finally(() => {
    console.log("done.");
  });
