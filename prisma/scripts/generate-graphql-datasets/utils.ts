import type {
  EventType,
  ExperienceLevel,
  Tag,
  TargetGroup,
} from "@prisma/client";
import { randomUUID } from "node:crypto";

export type GenericEntry = Tag | TargetGroup | EventType | ExperienceLevel;

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
      entryWithUuid["id"] = randomUUID();
    }
    return entryWithUuid;
  });

  return wantedEntriesWithUuid as GenericEntry[];
}
