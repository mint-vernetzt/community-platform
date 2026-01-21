import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      _count: {
        select: {
          admins: true,
          profileJoinInvites: {
            where: {
              role: "admin",
              status: "pending",
            },
          },
        },
      },
    },
  });

  return event;
}

export async function getEventIdBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
    },
  });

  if (event === null) {
    return null;
  }

  return event.id;
}
