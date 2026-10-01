import { prismaClient } from "~/prisma.server";
import { stages } from "../../../../prisma/scripts/import-datasets/data/stages";
import { type deriveModeForEvent } from "./detail.server";

export async function getIsParticipant(eventId: string, profileId?: string) {
  if (profileId === undefined) {
    return false;
  }
  const result = await prismaClient.participantOfEvent.findFirst({
    where: {
      eventId,
      profileId,
    },
  });
  return result !== null;
}

export async function filterEventConferenceLink(options: {
  event: {
    conferenceLink: string | null;
    conferenceCode: string | null;
    canceled: boolean;
    stage: {
      slug: string;
    } | null;
  };
  mode: Awaited<ReturnType<typeof deriveModeForEvent>>;
  isMember: boolean;
  inPast: boolean;
}) {
  const { event, mode, isMember, inPast } = options;

  const onlineStagesFromDataset = stages
    .filter((stage) => stage.slug === "online" || stage.slug === "hybrid")
    .map((stage) => stage.slug);

  const isOnlineEvent = onlineStagesFromDataset.some(
    (stageSlug) => event.stage !== null && event.stage.slug === stageSlug
  );
  const allowedToSeeConferenceLink =
    (isMember ||
      (mode === "participating" &&
        inPast === false &&
        event.canceled === false)) &&
    isOnlineEvent;

  let conferenceLink = event.conferenceLink;
  let conferenceCode = event.conferenceCode;

  if (allowedToSeeConferenceLink === false) {
    conferenceLink = null;
    conferenceCode = null;
  }
  return { conferenceLink, conferenceCode };
}
