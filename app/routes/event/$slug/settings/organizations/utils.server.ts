import { prismaClient } from "~/prisma";

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
