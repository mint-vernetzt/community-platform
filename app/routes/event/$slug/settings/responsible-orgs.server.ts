import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      _count: {
        select: {
          responsibleOrganizations: true,
          responsibleOrganizationInvites: {
            where: {
              status: "pending",
            },
          },
        },
      },
    },
  });

  return event;
}
