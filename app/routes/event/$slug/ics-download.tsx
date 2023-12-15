import { type Event } from "@prisma/client";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import type { DateArray } from "ics";
import * as ics from "ics";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { escapeFilenameSpecialChars } from "~/lib/string/escapeFilenameSpecialChars";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { removeHtmlTags } from "~/lib/utils/sanitizeUserHtml";
import { deriveEventMode } from "../utils.server";
import { getEventBySlug } from "./ics-download.server";
import {
  getIsParticipant,
  getIsSpeaker,
  getIsTeamMember,
} from "./utils.server";

// TODO: Add organizer to the ics file (see #432)
// see https://www.npmjs.com/package/ics
function createIcsString(
  event: Pick<
    Event,
    | "id"
    | "startTime"
    | "endTime"
    | "name"
    | "slug"
    | "createdAt"
    | "updatedAt"
    | "description"
    | "venueCity"
    | "venueName"
    | "venueStreet"
    | "venueStreetNumber"
    | "venueZipCode"
    | "conferenceLink"
    | "conferenceCode"
  > & { tags: Array<{ tag: { title: string } }> },
  absoluteEventUrl: string
) {
  const location: string[] = [];
  if (event.conferenceLink) {
    location.push(`Konferenzlink: ${event.conferenceLink}`);
  }
  if (event.conferenceCode) {
    location.push(`Zugangscode zur Konferenz: ${event.conferenceCode}`);
  }
  if (
    event.venueName ||
    event.venueStreet ||
    event.venueZipCode ||
    event.venueCity
  ) {
    location.push("Adresse:");
  }
  if (event.venueName) {
    location.push(`${event.venueName}`);
  }
  if (event.venueStreet) {
    const fullStreet = `${event.venueStreet} ${event.venueStreetNumber || ""}`;
    location.push(fullStreet.trim());
  }
  if (event.venueCity) {
    const fullCityAdress = `${
      event.venueZipCode ? `${event.venueZipCode}, ` : ""
    }${event.venueZipCode}`;
    location.push(fullCityAdress.trim());
  }
  const tagTitles = event.tags.map((item) => {
    return item.tag.title;
  });

  const icsEvent = {
    start: [
      event.startTime.getFullYear(),
      event.startTime.getMonth() + 1,
      event.startTime.getDate(),
      event.startTime.getHours(),
      event.startTime.getMinutes(),
    ] as DateArray,
    end: [
      event.endTime.getFullYear(),
      event.endTime.getMonth() + 1,
      event.endTime.getDate(),
      event.endTime.getHours(),
      event.endTime.getMinutes(),
    ] as DateArray,
    title: event.name,
    description: removeHtmlTags(event.description ?? "") || undefined,
    location: location.join("\n"),
    url: absoluteEventUrl,
    // TODO:
    // organizer: { name: "", email: "", dir: "any url (Maybe the community profile)"}
    categories: tagTitles,
    uid: event.id + event.slug,
    created: [
      event.createdAt.getFullYear(),
      event.createdAt.getMonth() + 1,
      event.createdAt.getDate(),
      event.createdAt.getHours(),
      event.createdAt.getMinutes(),
    ] as DateArray,
    lastModified: [
      event.updatedAt.getFullYear(),
      event.updatedAt.getMonth() + 1,
      event.updatedAt.getDate(),
      event.updatedAt.getHours(),
      event.updatedAt.getMinutes(),
    ] as DateArray,
  };

  const result: unknown = ics.createEvent(icsEvent, (error, icsString) => {
    if (error) {
      console.log(error);
      return null;
    }
    return icsString;
  });
  return result as string | null;
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const event = await getEventBySlug(slug);
  invariantResponse(event, "Event not found", { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);

  const isTeamMember = await getIsTeamMember(event.id, sessionUser.id);
  const isSpeaker = await getIsSpeaker(event.id, sessionUser.id);
  const isParticipant = await getIsParticipant(event.id, sessionUser.id);

  if (!(isTeamMember || isSpeaker || isParticipant)) {
    throw json(
      {
        message:
          "Um den Kalender-Eintrag herunterzuladen musst du entweder Teammitglied, Speaker oder Teilnehmer der Veranstaltung sein.",
      },
      { status: 403 }
    );
  }

  if (mode !== "admin" && event.published === false) {
    throw json({ message: "Event not published" }, { status: 403 });
  }

  const url = new URL(request.url);
  const absoluteEventURL =
    url.protocol + "//" + url.host + `/event/${event.slug}`;
  const ics = createIcsString(event, absoluteEventURL);
  const filename = escapeFilenameSpecialChars(event.name + ".ics");

  // TODO: Check for missing headers
  return new Response(ics, {
    status: 200,
    headers: {
      ...response.headers,
      "Content-Type": "text/calendar",
      "Content-Disposition": `filename=${filename}`,
    },
  });
};
