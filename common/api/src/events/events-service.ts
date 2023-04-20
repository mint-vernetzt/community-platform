import { prismaClient } from "../../prisma";

type Events = Awaited<ReturnType<typeof getEvents>>;

async function getEvents(skip: number, take: number) {
  const publicEvents = await prismaClient.event.findMany({
    select: {
      id: true,
      name: true,
    },
    skip,
    take,
  });
  return publicEvents;
}

export async function getAllEvents(
  skip: number,
  take: number
): Promise<{ skip: number; take: number; result: Events }> {
  const publicEvents = await getEvents(skip, take);
  return { skip, take, result: publicEvents };
}
