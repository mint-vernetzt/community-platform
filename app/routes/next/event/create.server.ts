import { prismaClient } from "~/prisma.server";

export async function getParentEventBySlug(slug: string) {
  const parentEvent = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      name: true,
      slug: true,
      participantLimit: true,
      _count: {
        select: { participants: true },
      },
      stage: {
        select: { slug: true },
      },
    },
  });
  return parentEvent;
}

export async function getParentEventBySlugForAction(
  slug: string,
  userId: string
) {
  const parentEvent = await prismaClient.event.findFirst({
    where: {
      slug,
      admins: { some: { profileId: userId } },
    },
    select: {
      id: true,
      slug: true,
      startTime: true,
      endTime: true,
    },
  });
  return parentEvent;
}

export async function createEvent(options: {
  userId: string;
  slug: string;
  data: {
    name: string;
    startTime: Date;
    endTime: Date;
    participationUntil: Date;
    parentEventId: string | null;
  };
}) {
  const { userId, slug, data } = options;

  let parentEvent = null;
  if (data.parentEventId !== null) {
    parentEvent = await prismaClient.event.findUnique({
      where: {
        id: data.parentEventId,
        admins: { some: { profileId: userId } },
      },
      select: {
        id: true,
        parentParticipationRequired: true,
      },
    });
    if (parentEvent === null) {
      throw new Error("Parent event not found");
    }
  }

  parentEvent;

  await prismaClient.$transaction(async (client) => {
    const event = await client.event.create({
      data: {
        ...data,
        slug,
      },
    });
    await client.eventVisibility.create({
      data: {
        eventId: event.id,
      },
    });
    await client.teamMemberOfEvent.create({
      data: {
        profileId: userId,
        eventId: event.id,
      },
    });
    await client.adminOfEvent.create({
      data: {
        profileId: userId,
        eventId: event.id,
      },
    });
    if (
      parentEvent !== null &&
      parentEvent.parentParticipationRequired === null
    ) {
      await client.event.update({
        where: {
          id: parentEvent.id,
        },
        data: {
          parentParticipationRequired: true,
        },
      });
    }
  });
}
