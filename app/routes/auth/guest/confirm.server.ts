import { prismaClient } from "~/prisma.server";

export async function getEventByToken(options: {
  token: string;
  type: string | null;
}) {
  const { token, type } = options;

  let guest;
  if (type === "revoke") {
    guest = await prismaClient.guest.findFirst({
      where: {
        revocationToken: token,
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
  } else {
    guest = await prismaClient.guest.findFirst({
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
  }

  if (guest === null) {
    return null;
  }

  return guest.event;
}
