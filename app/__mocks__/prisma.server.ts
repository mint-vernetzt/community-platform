import { type PrismaClient } from "@prisma/client";
import { beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

beforeEach(() => {
  mockReset(prismaClient);
});

const prismaClient = mockDeep<PrismaClient>();

export { prismaClient };
