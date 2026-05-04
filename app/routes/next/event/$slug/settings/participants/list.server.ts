import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  return event;
}
