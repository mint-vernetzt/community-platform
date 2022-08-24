import { serverError } from "remix-utils";
import { prismaClient } from "~/prisma";
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
  const ids = await getAllIdsOfChildEvens(eventId);

  await prismaClient.event.updateMany({
    where: { id: { in: [eventId, ...ids] } },
    data: { updatedAt: new Date(), published: publish },
  });
}

export async function getAllIdsOfChildEvens(eventId: string) {
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
    const childrenIds = await self.getAllIdsOfChildEvens(id);
    childEventChildrenIds = childEventChildrenIds.concat(childrenIds);
  }

  const allCollectedIds = ids.concat(childEventChildrenIds);
  const idsWithoutDuplicates = allCollectedIds.filter(
    (id, index, array) => array.indexOf(id) === index
  );
  return idsWithoutDuplicates;
}
