import { prismaClient } from "~/prisma.server";

export function getChildEventCount(slug: string) {
  return prismaClient.event.count({
    where: { parentEvent: { slug } },
  });
}
