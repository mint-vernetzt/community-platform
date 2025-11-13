import { stages } from "prisma/scripts/import-datasets/data/stages";
import { prismaClient } from "~/prisma.server";
import { type deriveModeForEvent } from "./detail.server";

export function getChildEventCount(slug: string) {
  return prismaClient.event.count({
    where: { parentEvent: { slug } },
  });
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
    (isMember === true || mode === "participating") &&
    inPast === false &&
    event.canceled === false &&
    isOnlineEvent === true;

  let conferenceLink = event.conferenceLink;
  let conferenceCode = event.conferenceCode;
  let conferenceLinkToBeAnnounced = false;

  if (allowedToSeeConferenceLink === true && conferenceLink === null) {
    conferenceLinkToBeAnnounced = true;
  }

  if (allowedToSeeConferenceLink === false) {
    conferenceLink = null;
    conferenceCode = null;
  }
  return { conferenceLink, conferenceCode, conferenceLinkToBeAnnounced };
}
