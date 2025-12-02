import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    select: {
      id: true,
      name: true,
      slug: true,
      published: true,
      _count: {
        select: {
          admins: true,
          teamMembers: true,
          speakers: true,
          participants: true,
          responsibleOrganizations: true,
          documents: true,
          childEvents: true,
        },
      },
    },
    where: { slug },
  });
  return event;
}
