import { serverError } from "remix-utils";
import { prismaClient } from "~/prisma";

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
