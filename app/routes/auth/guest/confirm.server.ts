import { prismaClient } from "~/prisma.server";

export async function getEventByToken(token: string) {
  const guest = await prismaClient.guest.findFirst({
    where: {
      confirmationToken: token,
    },
    select: {
      event: {
        select: {
          id: true,
          participantLimit: true,
          _count: {
            select: {
              participants: true,
            },
          },
        },
      },
    },
  });

  if (guest === null) {
    return null;
  }

  return guest.event;
}
