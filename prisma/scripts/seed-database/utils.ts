import type { Prisma, PrismaClient } from "@prisma/client";
import { prismaClient } from "~/prisma";

type EntityData<T> = T extends "profile"
  ? Prisma.ProfileCreateArgs["data"]
  : T extends "organization"
  ? Prisma.OrganizationCreateArgs["data"]
  : T extends "project"
  ? Prisma.ProjectCreateArgs["data"]
  : T extends "event"
  ? Prisma.EventCreateArgs["data"]
  : T extends "award"
  ? Prisma.AwardCreateArgs["data"]
  : T extends "document"
  ? Prisma.DocumentCreateArgs["data"]
  : never;

export async function seedEntity<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(type: T, entity: EntityData<T>) {
  // TODO: fix union type issue (almost got it but thats too hard...)
  const result = await prismaClient[type].create(entity);
}

// TODO: More specific types
export function getStandardEntity(type: string) {}

seedEntity<"profile">("profile", {
  email: "someuser",
  username: "",
  firstName: "",
  lastName: "",
  termsAccepted: true,
});
