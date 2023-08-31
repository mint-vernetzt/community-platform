import { prismaClient } from "~/prisma.server";

export async function connectOrganizationToEvent(
  eventId: string,
  organizationId: string
) {
  await prismaClient.responsibleOrganizationOfEvent.create({
    data: {
      eventId,
      organizationId,
    },
  });
}

export async function disconnectOrganizationFromEvent(
  eventId: string,
  organizationId: string
) {
  await prismaClient.responsibleOrganizationOfEvent.delete({
    where: {
      eventId_organizationId: {
        eventId,
        organizationId,
      },
    },
  });
}

export async function getEventById(id: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
    },
    where: {
      id,
    },
  });
}
