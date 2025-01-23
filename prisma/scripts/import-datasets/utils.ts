import { type ArrayElement } from "~/lib/utils/types";
import { type Dataset } from ".";
import { prismaClient } from "../../../app/prisma.server";

export type TableName =
  | "offer"
  | "organizationType"
  | "networkType"
  | "focus"
  | "tag"
  | "targetGroup" // legacy
  | "eventTargetGroup"
  | "projectTargetGroup"
  | "specialTargetGroup"
  | "eventType"
  | "experienceLevel"
  | "discipline"
  | "additionalDiscipline"
  | "format"
  | "financing"
  | "eventAbuseReportReasonSuggestion"
  | "stage";

type Lookup = {
  [key in ArrayElement<Dataset>["id"]]: ArrayElement<Dataset>;
};

export function filterMissingData(
  wantedEntries: Dataset,
  existingEntries: Dataset
) {
  const existingEntryIds = existingEntries.map((o) => o.id);
  return wantedEntries.filter(
    (wanted) => !existingEntryIds.includes(wanted.id)
  );
}

export function dataToBeUpdated(
  wantedEntries: Dataset,
  existingEntries: Dataset
) {
  // create object of {uuid1: {id: uuid1, title: title1}, uuid2: {id: uuid2, title: title2}, ... }
  const existingLookup = makeLookup(existingEntries);

  return wantedEntries.filter((wanted) => {
    const existing = existingLookup[wanted.id] !== undefined;
    return existing && !shallowComparison(existingLookup[wanted.id], wanted);
  });
}

export function makeLookup(entries: Dataset) {
  return entries.reduce((entry, value) => {
    entry[value.id] = value;
    return entry;
  }, {} as Lookup);
}

export function shallowComparison(
  obj1: ArrayElement<Dataset>,
  obj2: ArrayElement<Dataset>
) {
  return (
    Object.keys(obj1).length === Object.keys(obj2).length &&
    (Object.keys(obj1) as (keyof typeof obj1)[]).every((key) => {
      return (
        Object.prototype.hasOwnProperty.call(obj2, key) &&
        obj1[key] === obj2[key]
      );
    })
  );
}

export function entriesOnlyExistingOnDatabase(
  wantedEntries: Dataset,
  existingEntries: Dataset
) {
  const wantedLookup = makeLookup(wantedEntries);

  return existingEntries.filter(
    (existing) => wantedLookup[existing.id] === undefined
  );
}

export async function importDataset(dataset: Dataset, tableName: TableName) {
  console.log(`create entries for ${tableName}`);

  // @ts-ignore
  const existingEntries = await prismaClient[tableName].findMany();
  const missingData = filterMissingData(dataset, existingEntries);

  if (missingData.length > 0) {
    // @ts-ignore
    await prismaClient[tableName].createMany({ data: missingData });
    console.log(`added "${tableName}s": `, missingData);
  }

  const entriesToUpdate = dataToBeUpdated(dataset, existingEntries);
  if (entriesToUpdate.length > 0) {
    for (const entry of entriesToUpdate) {
      // @ts-ignore
      await prismaClient[tableName].update({
        where: {
          id: entry.id,
        },
        data: {
          ...entry,
        },
      });
    }

    console.log(`updated: "${tableName}s"`, entriesToUpdate);
  }

  const unknownEntries = entriesOnlyExistingOnDatabase(
    dataset,
    existingEntries
  );
  if (unknownEntries.length > 0) {
    console.log(`warning, unknown "${tableName}s" in db: `, unknownEntries);
  }

  if (missingData.length === 0 && entriesToUpdate.length === 0) {
    console.log(`table ${tableName} is up to date`);
  }
}
