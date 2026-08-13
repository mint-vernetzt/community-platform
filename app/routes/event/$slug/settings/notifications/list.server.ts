import { prismaClient } from "~/prisma.server";

export async function getEventStage(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      stage: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });

  if (event === null || event.stage === null) {
    return null;
  }

  return {
    ...event.stage,
  };
}
