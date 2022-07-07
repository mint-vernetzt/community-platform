import type { Offer, OrganizationType, MintFocus } from "@prisma/client";

export type GenericEntry = Offer | OrganizationType | MintFocus;

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
