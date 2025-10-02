import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      name: true,
      background: true,
      parentEvent: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  return event;
}
