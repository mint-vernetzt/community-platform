import organizationTypes from "./data/organizationTypes.json";
import offers from "./data/offers.json";
import focuses from "./data/focuses.json";
import { createDataset, GenericEntry, TableName } from "../utils";

const staticDatasets: Array<{ tableName: TableName; data: GenericEntry[] }> = [
  { tableName: "offer", data: offers },
  { tableName: "organizationType", data: organizationTypes },
  { tableName: "focus", data: focuses },
];

Promise.all(
  staticDatasets.map(
    (dataset) =>
      new Promise((resolve) => {
        createDataset(dataset.data, dataset.tableName).then(resolve);
      })
  )
)
  .catch((e) => {
    throw e;
  })
  .finally(() => {
    console.log("done.");
  });
