import { serverError } from "remix-utils";
import { prismaClient } from "~/prisma.server";
// important for testing nested calls (https://stackoverflow.com/a/55193363)
// maybe move helper functions like getUserByRequest to other module
// then we can just mock external modules
import * as self from "./utils.server";

export async function updateParentEventRelationOrThrow(
  eventId: string,
  parentEventId: string | undefined
) {
  try {
    if (parentEventId === undefined) {
      await prismaClient.event.update({
        where: { id: eventId },
        data: { updatedAt: new Date(), parentEvent: { disconnect: true } },
      });
    } else {
      await prismaClient.event.update({
        where: { id: eventId },
        data: {
          updatedAt: new Date(),
          parentEvent: { connect: { id: parentEventId } },
        },
      });
    }
  } catch (error) {
    console.error(error);
    throw serverError({ message: "Couldn't set parent event" });
  }
}

export async function addChildEventRelationOrThrow(
  eventId: string,
  childEventId: string
) {
  try {
    await prismaClient.event.update({
      where: {
        id: eventId,
      },
      data: {
        updatedAt: new Date(),
        childEvents: {
          connect: { id: childEventId },
        },
      },
    });
  } catch (error) {
    console.error(error);
    throw serverError({ message: "Couldn't add child event" });
  }
}

export async function removeChildEventRelationOrThrow(
  eventId: string,
  childEventId: string
) {
  try {
    await prismaClient.event.update({
      where: {
        id: eventId,
      },
      data: {
        updatedAt: new Date(),
        childEvents: {
          disconnect: { id: childEventId },
        },
      },
    });
  } catch (error) {
    console.error(error);
    throw serverError({ message: "Couldn't add child event" });
  }
}

export async function publishEventAndItsChildren(
  eventId: string,
  publish = true
) {
  const ids = await getAllIdsOfChildEvents(eventId);

  await prismaClient.event.updateMany({
    where: { id: { in: [eventId, ...ids] } },
    data: { updatedAt: new Date(), published: publish },
  });
}

export async function cancelEvent(eventId: string, cancel = true) {
  await prismaClient.event.update({
    where: { id: eventId },
    data: { canceled: cancel, updatedAt: new Date() },
  });
}

export async function getAllIdsOfChildEvents(eventId: string) {
  const result = await prismaClient.event.findFirst({
    where: { id: eventId },
    select: {
      childEvents: {
        select: {
          id: true,
        },
      },
    },
  });

  if (result === null) {
    return [];
  }

  const ids = result.childEvents.map((childEvent) => childEvent.id);

  let childEventChildrenIds: string[] = [];
  for (let id of ids) {
    const childrenIds = await self.getAllIdsOfChildEvents(id);
    childEventChildrenIds = childEventChildrenIds.concat(childrenIds);
  }

  const allCollectedIds = ids.concat(childEventChildrenIds);
  const idsWithoutDuplicates = allCollectedIds.filter(
    (id, index, array) => array.indexOf(id) === index
  );
  return idsWithoutDuplicates;
}

export async function getEventById(id: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      startTime: true,
      endTime: true,
      name: true,
    },
    where: {
      id,
    },
  });
}
