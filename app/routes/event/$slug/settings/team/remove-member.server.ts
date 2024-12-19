import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type RemoveEventTeamMemberLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["event/$slug/settings/team/remove-member"];

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      _count: {
        select: {
          teamMembers: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function removeTeamMemberFromEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.teamMemberOfEvent.delete({
    where: {
      eventId_profileId: {
        eventId,
        profileId,
      },
    },
  });
}
