import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      published: true,
      external: true,
      openForRegistration: true,
      parentParticipationRequired: true,
      _count: {
        select: {
          childEvents: true,
        },
      },
    },
  });

  return event;
}
