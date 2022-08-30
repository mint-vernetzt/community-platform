import type { Focus, Offer, OrganizationType, Tag } from "@prisma/client";
import { prismaClient } from "~/prisma";

export type GenericEntry = Offer | OrganizationType | Focus | Tag;

export type TableName = "offer" | "organizationType" | "focus" | "tag";

type Lookup = {
  [keyof: string]: GenericEntry;
};

export function filterMissingData(
  wantedEntries: GenericEntry[],
  existingEntries: GenericEntry[]
) {
  const existingEntryIds = existingEntries.map((o) => o.id);
  return wantedEntries.filter(
    (wanted) => !existingEntryIds.includes(wanted.id)
  );
}

export function dataToBeUpdated(
  wantedEntries: GenericEntry[],
  existingEntries: GenericEntry[]
) {
  // create object of {uuid1: {id: uuid1, title: title1}, uuid2: {id: uuid2, title: title2}, ... }
  const existingLookup = makeLookup(existingEntries);

  return wantedEntries.filter((wanted) => {
    const existing = existingLookup[wanted.id] !== undefined;
    return (
      existing &&
      !shallowComparison<GenericEntry>(existingLookup[wanted.id], wanted)
    );
  });
}

export function makeLookup(entries: GenericEntry[]) {
  return entries.reduce((entry, value) => {
    entry[value.id] = value;
    return entry;
  }, {} as Lookup);
}

export function shallowComparison<T>(obj1: T, obj2: T) {
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
  wantedEntries: GenericEntry[],
  existingEntries: GenericEntry[]
) {
  const wantedLookup = makeLookup(wantedEntries);

  return existingEntries.filter(
    (existing) => wantedLookup[existing.id] === undefined
  );
}

export async function importDataset(
  datasets: GenericEntry[],
  tableName: TableName
) {
  console.log(`create entries for ${tableName}`);

  // @ts-ignore
  const existingEntries = await prismaClient[tableName].findMany();
  const missingData = filterMissingData(datasets, existingEntries);

  if (missingData.length > 0) {
    // @ts-ignore
    await prismaClient[tableName].createMany({ data: missingData });
    console.log("added: ", missingData);
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

    console.log("updated: ", entriesToUpdate);
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
