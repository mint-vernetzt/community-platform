import type { DateArray } from "ics";
import * as ics from "ics";
import { LoaderFunction } from "remix";
import { forbidden } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { transformAbsoluteURL } from "~/lib/utils/string";
import { deriveMode, getEventBySlugOrThrow } from "./utils.server";

type EventWithRelations = Awaited<ReturnType<typeof getEventBySlugOrThrow>>;

// TODO: Add status (CONFIRMED/CANCELLED) to the ics file (see #437)
// TODO: Maybe add attendees to the ics file (see #433)
// TODO: Add organizer to the ics file (see #432)
// see https://www.npmjs.com/package/ics
function createIcsString(
  event: Pick<
    EventWithRelations,
    | "id"
    | "startTime"
    | "endTime"
    | "name"
    | "slug"
    | "createdAt"
    | "updatedAt"
    | "description"
    | "tags"
    | "venueCity"
    | "venueName"
    | "venueStreet"
    | "venueStreetNumber"
    | "venueZipCode"
    | "conferenceLink"
    | "conferenceCode"
  >,
  absoluteEventUrl: string
) {
  const location: string[] = [];
  if (event.conferenceLink) {
    location.push(`Konferenzlink: ${event.conferenceLink}`);
  }
  if (event.conferenceCode) {
    location.push(`Zugangscode zur Konferenz: ${event.conferenceCode}`);
  }
  if (event.venueName) {
    location.push(event.venueName);
  }
  if (event.venueStreet) {
    const fullStreet = `${event.venueStreet} ${event.venueStreetNumber || ""}`;
    location.push(fullStreet.trim());
  }
  if (event.venueZipCode) {
    location.push(event.venueZipCode);
  }
  if (event.venueCity) {
    location.push(event.venueCity);
  }
  const tagTitles = event.tags.map((item) => {
    return item.tag.title;
  });

  const icsEvent = {
    start: [
      event.startTime.getFullYear(),
      event.startTime.getMonth(),
      event.startTime.getDate(),
      event.startTime.getHours(),
      event.startTime.getMinutes(),
    ] as DateArray,
    end: [
      event.endTime.getFullYear(),
      event.endTime.getMonth(),
      event.endTime.getDate(),
      event.endTime.getHours(),
      event.endTime.getMinutes(),
    ] as DateArray,
    title: event.name,
    description: event.description || undefined,
    location: location.join(", "),
    url: absoluteEventUrl,
    // TODO:
    // status: "CONFIRMED" || "CANCELLED" || "TENTATIVE"
    // organizer: { name: "", email: "", dir: "any url (Maybe the community profile)"}
    categories: tagTitles,
    uid: event.id + event.slug,
    created: [
      event.createdAt.getFullYear(),
      event.createdAt.getMonth(),
      event.createdAt.getDate(),
      event.createdAt.getHours(),
      event.createdAt.getMinutes(),
    ] as DateArray,
    lastModified: [
      event.updatedAt.getFullYear(),
      event.updatedAt.getMonth(),
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

type LoaderData = Response;

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const currentUser = await getUserByRequest(request);
  const slug = getParamValueOrThrow(params, "slug");
  const event = await getEventBySlugOrThrow(slug);
  const mode = await deriveMode(event, currentUser);

  if (mode !== "owner" && event.published === false) {
    throw forbidden({ message: "Event not published" });
  }

  const urlEndingToRemove = "icsDownload";
  const urlEndingToAppend = "";
  const absoluteEventURL = transformAbsoluteURL(
    request.url,
    urlEndingToRemove,
    urlEndingToAppend
  );
  const ics = createIcsString(event, absoluteEventURL);

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `filename="${event.name}.ics"`,
    },
  });
};
