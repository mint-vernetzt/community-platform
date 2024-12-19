import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type EventSpeakersSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["event/$slug/settings/speakers"];

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
