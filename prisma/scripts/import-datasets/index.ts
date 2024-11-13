import { prismaClient } from "~/prisma.server";
import disciplines from "./data/disciplines.json";
import additionalDisciplines from "./data/additionalDisciplines.json";
import eventTypes from "./data/eventTypes.json";
import experienceLevels from "./data/experienceLevels.json";
import focuses from "./data/focuses.json";
import offers from "./data/offers.json";
import organizationTypes from "./data/organizationTypes.json";
import networkTypes from "./data/networkTypes.json";
import stages from "./data/stages.json";
import tags from "./data/tags.json";
import formats from "./data/formats.json";
import financings from "./data/financings.json";
import targetGroups from "./data/targetGroups_legacy.json";
import eventTargetGroups from "./data/eventTargetGroups.json";
import projectTargetGroups from "./data/projectTargetGroups.json";
import specialTargetGroups from "./data/specialTargetGroups.json";
import eventAbuseReportReasonSuggestions from "./data/eventAbuseReportReasonSuggestions.json";
import type { GenericEntry, TableName } from "./utils";
import { importDataset } from "./utils";

const staticDatasets: Array<{ tableName: TableName; data: GenericEntry[] }> = [
  { tableName: "offer", data: offers },
  { tableName: "organizationType", data: organizationTypes },
  { tableName: "networkType", data: networkTypes },
  { tableName: "focus", data: focuses },
  { tableName: "tag", data: tags },
  { tableName: "eventTargetGroup", data: eventTargetGroups },
  { tableName: "projectTargetGroup", data: projectTargetGroups },
  { tableName: "targetGroup", data: targetGroups }, // legacy
  { tableName: "specialTargetGroup", data: specialTargetGroups },
  { tableName: "eventType", data: eventTypes },
  { tableName: "experienceLevel", data: experienceLevels },
  { tableName: "stage", data: stages },
  { tableName: "discipline", data: disciplines },
  { tableName: "additionalDiscipline", data: additionalDisciplines },
  { tableName: "format", data: formats },
  { tableName: "financing", data: financings },
  {
    tableName: "eventAbuseReportReasonSuggestion",
    data: eventAbuseReportReasonSuggestions,
  },
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
  .finally(async () => {
    await prismaClient.$disconnect();
    console.log("done.");
  });
