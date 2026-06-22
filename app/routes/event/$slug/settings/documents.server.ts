import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      _count: {
        select: {
          documents: true,
        },
      },
    },
  });

  return event;
}
