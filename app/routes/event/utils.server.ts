import { Event, Tag } from "@prisma/client";
import type { DateArray } from "ics";
import * as ics from "ics"; // ics is undefined
import { MakeOptional } from "~/lib/utils/types";
import { prismaClient } from "~/prisma";

export async function createEventOnProfile(
  profileId: string,
  eventOptions: {
    slug: string;
    name: string;
    startTime: Date;
    endTime: Date;
    participationUntil: Date;
    ics: string | null;
  },
  relationOptions?: {
    child: string | null;
    parent: string | null;
  }
) {
  let relations: { parentEvent?: any; childEvents?: any } = {};
  if (relationOptions !== undefined) {
    if (relationOptions.parent !== null) {
      relations.parentEvent = { connect: { id: relationOptions.parent } };
    }
    if (relationOptions.child !== null) {
      relations.childEvents = { connect: { id: relationOptions.child } };
    }
  }

  const profile = prismaClient.profile.update({
    where: {
      id: profileId,
    },
    data: {
      teamMemberOfEvents: {
        create: {
          isPrivileged: true,
          event: {
            create: {
              ...eventOptions,
              ...relations,
            },
          },
        },
      },
    },
  });
  return profile;
}

type EventWithIcsRelevantRelations = Event & {
  tags: Pick<Tag, "title">[];
};

// TODO: Add status (CONFIRMED/CANCELLED) to the ics file (see #437)
// TODO: Add attendees to the ics file (see #433)
// TODO: Add organizer to the ics file (see #432)
// see https://www.npmjs.com/package/ics
export function createIcsString(
  event: MakeOptional<
    Pick<
      EventWithIcsRelevantRelations,
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
  console.log("CREATE ICS STRING -----------\n\n");

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
  let tagTitles: string[] = [];
  if (event.tags) {
    tagTitles = event.tags.map((tag) => {
      return tag.title;
    });
  }

  console.log("BEFORE ICS EVENT -----------\n\n");
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
    // attendees: [
    // {
    // name: "",
    // email: "",
    // dir "any url (Maybe the community profile)",
    // rsvp: default false<-Do we need this?,
    // partstat: "ACCEPTED",
    // role: "REQ_PARTICPANT"<-Do we need this?
    // }
    // ]
    categories: tagTitles,
    // TODO: Ensure globally uniqueness of uid (see #436)
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
