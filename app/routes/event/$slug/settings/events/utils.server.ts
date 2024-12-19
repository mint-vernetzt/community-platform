import { prismaClient } from "~/prisma.server";
// important for testing nested calls (https://stackoverflow.com/a/55193363)
// maybe move helper functions like getUserByRequest to other module
// then we can just mock external modules
import { invariantResponse } from "~/lib/utils/response";
import * as self from "./utils.server";

export async function updateParentEventRelationOrThrow(
  slug: string,
  parentEventId: string | undefined
) {
  try {
    if (parentEventId === undefined) {
      await prismaClient.event.update({
        where: { slug },
        data: { parentEvent: { disconnect: true } },
      });
    } else {
      await prismaClient.event.update({
        where: { slug },
        data: {
          parentEvent: { connect: { id: parentEventId } },
        },
      });
    }
  } catch (error) {
    console.error({ error });
    invariantResponse(false, "Couldn't set parent event", { status: 500 });
  }
}

export async function addChildEventRelationOrThrow(
  slug: string,
  childEventId: string
) {
  try {
    await prismaClient.event.update({
      where: {
        slug,
      },
      data: {
        updatedAt: new Date(),
        childEvents: {
          connect: { id: childEventId },
        },
      },
    });
  } catch (error) {
    console.error({ error });
    invariantResponse(false, "Couldn't add child event", { status: 500 });
  }
}

export async function removeChildEventRelationOrThrow(
  slug: string,
  childEventId: string
) {
  try {
    await prismaClient.event.update({
      where: {
        slug,
      },
      data: {
        updatedAt: new Date(),
        childEvents: {
          disconnect: { id: childEventId },
        },
      },
    });
  } catch (error) {
    console.error({ error });
    invariantResponse(false, "Couldn't remove child event", { status: 500 });
  }
}

export async function publishEventAndItsChildren(slug: string, publish = true) {
  const slugs = await getAllSlugsOfChildEvents(slug);

  await prismaClient.event.updateMany({
    where: { slug: { in: [slug, ...slugs] } },
    data: { published: publish },
  });
}

export async function cancelEvent(slug: string, cancel = true) {
  await prismaClient.event.update({
    where: { slug },
    data: { canceled: cancel, updatedAt: new Date() },
  });
}

export async function getAllSlugsOfChildEvents(slug: string) {
  const result = await prismaClient.event.findFirst({
    where: { slug },
    select: {
      childEvents: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (result === null) {
    return [];
  }

  const slugs = result.childEvents.map((childEvent) => childEvent.slug);

  let childEventChildrenSlugs: string[] = [];
  for (const slug of slugs) {
    const childrenSlugs = await self.getAllSlugsOfChildEvents(slug);
    childEventChildrenSlugs = childEventChildrenSlugs.concat(childrenSlugs);
  }

  const allCollectedSlugs = slugs.concat(childEventChildrenSlugs);
  const slugsWithoutDuplicates = allCollectedSlugs.filter(
    (slug, index, array) => array.indexOf(slug) === index
  );
  return slugsWithoutDuplicates;
}

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      startTime: true,
      endTime: true,
      name: true,
    },
    where: {
      slug,
    },
  });
}
