import type { PrismaClient } from "@prisma/client";
import { prismaClient } from "~/prisma";

export interface Context {
  prisma: PrismaClient;
}

export const context: Context = {
  prisma: prismaClient,
};
