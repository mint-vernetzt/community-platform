import { importDataset, GenericEntry, TableName } from "./utils";
import focuses from "./data/focuses.json";
import offers from "./data/offers.json";
import organizationTypes from "./data/organizationTypes.json";
import tags from "./data/tags.json";

const staticDatasets: Array<{ tableName: TableName; data: GenericEntry[] }> = [
  { tableName: "offer", data: offers },
  { tableName: "organizationType", data: organizationTypes },
  { tableName: "focus", data: focuses },
  { tableName: "tag", data: tags },
];

Promise.all(
  staticDatasets.map(
    (dataset) =>
      new Promise((resolve) => {
        importDataset(dataset.data, dataset.tableName).then(resolve);
      })
  )
)
  .catch((e) => {
    throw e;
  })
  .finally(() => {
    console.log("done.");
  });
