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
