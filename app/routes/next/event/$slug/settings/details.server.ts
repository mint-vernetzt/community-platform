import { prismaClient } from "~/prisma.server";
import { sanitizeUserHtml } from "~/utils.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      name: true,
      types: {
        select: {
          eventType: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      },
      subline: true,
      description: true,
      descriptionRTEState: true,
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      },
      eventTargetGroups: {
        select: {
          eventTargetGroup: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      },
      experienceLevel: {
        select: {
          id: true,
          slug: true,
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  return event;
}

export async function getAllEventTypes() {
  const eventTypes = await prismaClient.eventType.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  return eventTypes;
}

export async function getAllTags() {
  const tags = await prismaClient.tag.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  return tags;
}

export async function getAllEventTargetGroups() {
  const eventTargetGroups = await prismaClient.eventTargetGroup.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  return eventTargetGroups;
}

export async function getAllExperienceLevels() {
  const experienceLevels = await prismaClient.experienceLevel.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  return experienceLevels;
}

export async function getAllFocuses() {
  const focuses = await prismaClient.focus.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  return focuses;
}

export async function getEventBySlugForAction(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
    },
  });

  return event;
}

export async function updateEventBySlug(
  slug: string,
  id: string,
  data: {
    name: string;
    types: string[];
    subline: string | null;
    description: string | null;
    descriptionRTEState: string | null;
    tags: string[];
    eventTargetGroups: string[];
    experienceLevel: string | null;
    focuses: string[];
  }
) {
  const description = sanitizeUserHtml(data.description);
  const trimmedDescription =
    description !== null
      ? description
          .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
          .trim()
      : null;
  const updatedEvent = await prismaClient.event.update({
    where: { slug },
    data: {
      ...data,
      description: trimmedDescription,
      experienceLevel:
        data.experienceLevel !== null
          ? { connect: { id: data.experienceLevel } }
          : { disconnect: true },
      types: {
        deleteMany: {},
        connectOrCreate: data.types.map((eventTypeId) => {
          return {
            where: {
              eventTypeId_eventId: {
                eventTypeId,
                eventId: id,
              },
            },
            create: {
              eventTypeId,
            },
          };
        }),
      },
      tags: {
        deleteMany: {},
        connectOrCreate: data.tags.map((tagId) => {
          return {
            where: {
              tagId_eventId: {
                tagId,
                eventId: id,
              },
            },
            create: {
              tagId,
            },
          };
        }),
      },
      eventTargetGroups: {
        deleteMany: {},
        connectOrCreate: data.eventTargetGroups.map((eventTargetGroupId) => {
          return {
            where: {
              eventTargetGroupId_eventId: {
                eventTargetGroupId,
                eventId: id,
              },
            },
            create: {
              eventTargetGroupId,
            },
          };
        }),
      },
      focuses: {
        deleteMany: {},
        connectOrCreate: data.focuses.map((focusId) => {
          return {
            where: {
              eventId_focusId: {
                focusId,
                eventId: id,
              },
            },
            create: {
              focusId,
            },
          };
        }),
      },
    },
  });
  return updatedEvent;
}
