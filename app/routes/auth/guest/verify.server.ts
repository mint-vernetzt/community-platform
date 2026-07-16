import { prismaClient } from "~/prisma.server";

export async function verifyConfirmationToken(token: string) {
  const guest = await prismaClient.guest.findFirst({
    where: {
      confirmationToken: token,
    },
  });

  if (guest === null) {
    return {
      error: { message: "Guest not found", code: "guest_not_found" } as const,
      data: null,
    };
  }

  return {
    error: null,
    data: guest,
  };
}

export async function confirmGuest(guestId: string) {
  const now = new Date();
  const guest = await prismaClient.guest.update({
    where: {
      id: guestId,
    },
    data: {
      confirmed: true,
      confirmedAt: now,
      confirmationToken: null,
      termsAccepted: true,
      termsAcceptedAt: now,
    },
  });

  return guest;
}
