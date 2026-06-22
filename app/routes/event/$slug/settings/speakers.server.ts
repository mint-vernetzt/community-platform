import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      _count: {
        select: {
          speakers: true,
          profileJoinInvites: {
            where: {
              role: "speaker",
              status: "pending",
            },
          },
        },
      },
    },
  });

  return event;
}
