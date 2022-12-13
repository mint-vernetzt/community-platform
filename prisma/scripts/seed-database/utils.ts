import { Prisma } from "@prisma/client";
import { prismaClient } from "~/prisma";

type EntityTypes = Prisma.ProfileDelegate<
  Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
>;

// TODO: More specific types
export function seedEntity(type: EntityTypes, entity: object) {
  const result = await prismaClient.profile.create({
    data: entity,
  });
}

// TODO: More specific types
export function getStandardEntity(type: string) {}
