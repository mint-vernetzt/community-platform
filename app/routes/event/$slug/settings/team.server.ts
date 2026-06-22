import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      _count: {
        select: {
          teamMembers: true,
          profileJoinInvites: {
            where: {
              role: "member",
              status: "pending",
            },
          },
        },
      },
    },
  });

  return event;
}
