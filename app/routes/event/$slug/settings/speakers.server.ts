import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
      speakers: {
        select: {
          profile: {
            select: {
              id: true,
              avatar: true,
              firstName: true,
              lastName: true,
              username: true,
              position: true,
            },
          },
        },
        orderBy: {
          profile: {
            firstName: "asc",
          },
        },
      },
    },
    where: {
      slug,
    },
  });
}

export function getSpeakerProfileDataFromEvent(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>
) {
  const profileData = event.speakers.map((speaker) => {
    const { profile } = speaker;
    return profile;
  });
  return profileData;
}
