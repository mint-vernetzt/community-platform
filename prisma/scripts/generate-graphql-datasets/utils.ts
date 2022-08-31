import type { Tag, TargetGroup } from "@prisma/client";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";

export type GenericEntry = Tag | TargetGroup;

export function addUuids(
  wantedEntries: Omit<GenericEntry, "id">[],
  existingEntries?: GenericEntry[]
) {
  const idMap = new Map();

  if (existingEntries !== undefined && existingEntries.length !== 0) {
    existingEntries.map((entry) => idMap.set(entry.referenceId, entry.id));
  }

  const wantedEntriesWithUuid = wantedEntries.map((entry) => {
    let entryWithUuid: Partial<GenericEntry> = entry;

    const uuid = idMap.get(entry.referenceId);
    if (uuid !== undefined) {
      entryWithUuid["id"] = uuid;
    } else {
      entryWithUuid["id"] = uuidv4();
    }
    return entryWithUuid;
  });

  return wantedEntriesWithUuid as GenericEntry[];
}
