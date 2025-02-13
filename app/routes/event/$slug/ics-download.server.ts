import { prismaClient } from "~/prisma.server";
import { type Event } from "@prisma/client";
import type { DateArray } from "ics";
import * as ics from "ics";
import { removeHtmlTags } from "~/lib/utils/transformHtml";
import { invariantResponse } from "~/lib/utils/response";

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
      slug: true,
      name: true,
      startTime: true,
      endTime: true,
      createdAt: true,
      updatedAt: true,
      description: true,
      tags: {
        select: {
          tag: {
            select: {
              title: true,
            },
          },
        },
      },
      venueCity: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      conferenceLink: true,
      conferenceCode: true,
    },
    where: {
      slug,
    },
  });
}

// TODO: Add organizer to the ics file (see #432)
// see https://www.npmjs.com/package/ics
export function createIcsString(
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
      invariantResponse(false, "Error creating ics file", { status: 500 });
    }
    return icsString;
  });
  return result as string;
}
