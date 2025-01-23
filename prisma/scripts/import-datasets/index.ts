import { prismaClient } from "~/prisma.server";
import { disciplines } from "./data/disciplines";
import { additionalDisciplines } from "./data/additionalDisciplines";
import { eventTypes } from "./data/eventTypes";
import { experienceLevels } from "./data/experienceLevels";
import { focuses } from "./data/focuses";
import { offers } from "./data/offers";
import { organizationTypes } from "./data/organizationTypes";
import { networkTypes } from "./data/networkTypes";
import { stages } from "./data/stages";
import { tags } from "./data/tags";
import { formats } from "./data/formats";
import { financings } from "./data/financings";
import { targetGroups_legacy } from "./data/targetGroups_legacy";
import { eventTargetGroups } from "./data/eventTargetGroups";
import { projectTargetGroups } from "./data/projectTargetGroups";
import { specialTargetGroups } from "./data/specialTargetGroups";
import { eventAbuseReportReasonSuggestions } from "./data/eventAbuseReportReasonSuggestions";
import type { TableName } from "./utils";
import { importDataset } from "./utils";

export type Dataset =
  | typeof disciplines
  | typeof additionalDisciplines
  | typeof eventTypes
  | typeof experienceLevels
  | typeof focuses
  | typeof offers
  | typeof organizationTypes
  | typeof networkTypes
  | typeof stages
  | typeof tags
  | typeof formats
  | typeof financings
  | typeof targetGroups_legacy
  | typeof eventTargetGroups
  | typeof projectTargetGroups
  | typeof specialTargetGroups
  | typeof eventAbuseReportReasonSuggestions;

export type ExplicitDataset<
  T extends
    | "disciplines"
    | "additionalDisciplines"
    | "eventTypes"
    | "experienceLevels"
    | "focuses"
    | "offers"
    | "organizationTypes"
    | "networkTypes"
    | "stages"
    | "tags"
    | "formats"
    | "financings"
    | "targetGroups_legacy"
    | "eventTargetGroups"
    | "projectTargetGroups"
    | "specialTargetGroups"
    | "eventAbuseReportReasonSuggestions"
> = T extends "disciplines"
  ? typeof disciplines
  : T extends "additionalDisciplines"
  ? typeof additionalDisciplines
  : T extends "eventTypes"
  ? typeof eventTypes
  : T extends "experienceLevels"
  ? typeof experienceLevels
  : T extends "focuses"
  ? typeof focuses
  : T extends "offers"
  ? typeof offers
  : T extends "organizationTypes"
  ? typeof organizationTypes
  : T extends "networkTypes"
  ? typeof networkTypes
  : T extends "stages"
  ? typeof stages
  : T extends "tags"
  ? typeof tags
  : T extends "formats"
  ? typeof formats
  : T extends "financings"
  ? typeof financings
  : T extends "targetGroups_legacy"
  ? typeof targetGroups_legacy
  : T extends "eventTargetGroups"
  ? typeof eventTargetGroups
  : T extends "projectTargetGroups"
  ? typeof projectTargetGroups
  : T extends "specialTargetGroups"
  ? typeof specialTargetGroups
  : typeof eventAbuseReportReasonSuggestions;

const staticDatasets: Array<{
  tableName: TableName;
  data: Dataset;
}> = [
  { tableName: "offer", data: offers },
  { tableName: "organizationType", data: organizationTypes },
  { tableName: "networkType", data: networkTypes },
  { tableName: "focus", data: focuses },
  { tableName: "tag", data: tags },
  { tableName: "eventTargetGroup", data: eventTargetGroups },
  { tableName: "projectTargetGroup", data: projectTargetGroups },
  { tableName: "targetGroup", data: targetGroups_legacy }, // legacy
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
