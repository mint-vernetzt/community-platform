import { faker } from "@faker-js/faker";
import type { Event } from "@prisma/client";
import { prismaClient } from "~/prisma";
import { generateEventSlug } from "../../../app/utils";

export type EventStructure =
  | "developer"
  | "standard"
  | "largeTeam"
  | "smallTeam"
  | "depth2"
  | "depth3"
  | "fullParticipants"
  | "overfullParticipants"
  | "canceled"
  | "unpublished"
  | "manyDocuments"
  | "manyResponsibleOrganizations"
  | "manySpeakers"
  | "manyParticipants"
  | "smallest"
  | "emptyStrings"
  | "unicode"
  | "largest";

export type EventBucketData =
  | {
      background: {
        path: string;
      };
    }
  | undefined;

export function getEventData(
  structure: EventStructure,
  index: number,
  bucketData: EventBucketData,
  useRealNames: boolean,
  numberOfStandardEntities: number
) {
  const eventData: Omit<
    Event,
    | "id"
    | "parentEventId"
    | "experienceLevelId"
    | "stageId"
    | "updatedAt"
    | "createdAt"
  > = {
    name: generateName(structure, useRealNames),
    slug: generateSlug(structure),
    startTime: generateStartTime(structure, index),
    endTime: generateEndTime(structure, index),
    description: generateDescription(structure),
    subline: generateSubline(structure),
    published: generatePublished(structure),
    conferenceLink: generateConferenceLink(structure),
    conferenceCode: generateConferenceCode(structure),
    participantLimit: generateParticipantLimit(
      structure,
      index,
      numberOfStandardEntities
    ),
    participationFrom: generateParticipationFrom(index),
    participationUntil: generateParticipationUntil(index),
    venueName: generateVenueName(structure),
    venueStreet: generateVenueStreet(structure),
    venueStreetNumber: generateVenueStreetNumber(structure),
    venueCity: generateVenueCity(structure),
    venueZipCode: generateVenueZipCode(structure),
    canceled: generateCanceled(structure),
    background: setBackground(structure, bucketData),
  };
  return eventData;
}

export async function seedEvent(
  eventData: Omit<
    Event,
    | "id"
    | "parentEventId"
    | "experienceLevelId"
    | "stageId"
    | "updatedAt"
    | "createdAt"
  >
) {
  const result = await prismaClient.event.create({
    data: eventData,
    select: { id: true },
  });
  return result.id;
}

function generateName(structure: EventStructure, useRealNames: boolean) {
  let name;
  if (useRealNames) {
    name = faker.music.genre();
  } else {
    if (structure === "developer") {
      name = `0_${structure} Event`;
    } else if (structure === "standard") {
      name = `Y_${structure} Event`;
    } else if (structure === "unicode") {
      name = `${structure} Event_Γ`;
    } else {
      name = `${structure} Event`;
    }
  }
  return name;
}

function generateSlug(structure: EventStructure) {
  let slug;
  if (structure === "developer") {
    slug = generateEventSlug(`0_${structure} Event`);
  } else if (structure === "standard") {
    slug = generateEventSlug(`Y_${structure} Event`);
  } else if (structure === "unicode") {
    slug = generateEventSlug(`${structure} Event_Γ`);
  } else {
    slug = generateEventSlug(`${structure} Event`);
  }
  return slug;
}

function generateFutureAndPastTimes(
  index: number,
  timeDelta?: {
    years?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
  }
) {
  const oneHourInMillis = 3_600_000;
  const oneDayInMillis = 86_400_000;
  const oneWeekInMillis = 604_800_000;
  const oneMonthInMillis = 2_628_000_000;
  const oneYearInMillis = 31_540_000_000;
  const now = new Date();
  const nowPlusTimeDeltaInMillis =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours()
    ).getTime() +
    (timeDelta?.hours ? oneHourInMillis * timeDelta.hours : 0) +
    (timeDelta?.days ? oneDayInMillis * timeDelta.days : 0) +
    (timeDelta?.weeks ? oneWeekInMillis * timeDelta.weeks : 0) +
    (timeDelta?.months ? oneMonthInMillis * timeDelta.months : 0) +
    (timeDelta?.years ? oneYearInMillis * timeDelta.years : 0);
  const futurePastSwitcher = index % 2 === 0 ? 1 : -1;

  // Generating future and past times in a daily turnus, depending on the given index
  const futurePastTimeInMillis =
    index * futurePastSwitcher * (oneDayInMillis / 2) +
    nowPlusTimeDeltaInMillis;
  const futurePastDate = new Date(futurePastTimeInMillis);

  return futurePastDate;
}

function generateStartTime(structure: EventStructure, index: number) {
  let startTime;
  if (structure === "depth2") {
    // Depth 2 events start 6 hours earlier to better add childEvents
    const timeDelta = {
      hours: -6,
    };
    startTime = generateFutureAndPastTimes(index, timeDelta);
  } else if (structure === "depth3") {
    // Depth 2 events start 12 hours earlier to better add childEvents
    const timeDelta = {
      hours: -12,
    };
    startTime = generateFutureAndPastTimes(index, timeDelta);
  } else {
    startTime = generateFutureAndPastTimes(index);
  }
  return startTime;
}

function generateEndTime(structure: EventStructure, index: number) {
  let endTime;
  if (structure === "depth2") {
    // 2 day long event (to be able to add the one day seperated child events)
    const timeDelta = {
      days: 2,
    };
    endTime = generateFutureAndPastTimes(index, timeDelta);
  } else if (structure === "depth3") {
    // 4 day long event (to be able to add the two day long child events (see depth2))
    const timeDelta = {
      days: 4,
    };
    endTime = generateFutureAndPastTimes(index, timeDelta);
  } else {
    // Hourly event
    const timeDelta = {
      hours: faker.datatype.number({ min: 1, max: 4 }),
    };
    endTime = generateFutureAndPastTimes(index, timeDelta);
  }
  return endTime;
}

function generateDescription(structure: EventStructure) {
  let description;
  if (structure === "smallest") {
    description = null;
  } else if (structure === "emptyStrings") {
    description = "";
  } else if (structure === "unicode") {
    description = "A description containing unicode character_Γ";
  } else if (structure === "largest") {
    description = faker.lorem.paragraphs(7).substring(0, 1000);
  } else {
    description = faker.lorem.paragraphs(3);
  }
  return description;
}

function generateSubline(structure: EventStructure) {
  let subline;
  if (structure === "smallest") {
    subline = null;
  } else if (structure === "emptyStrings") {
    subline = "";
  } else if (structure === "unicode") {
    subline = "A subline containing unicode character_Γ";
  } else if (structure === "largest") {
    subline = faker.lorem.sentences(5).substring(0, 70);
  } else {
    subline = faker.lorem.sentence();
  }
  return subline;
}

function generatePublished(structure: EventStructure) {
  let published;
  if (structure === "unpublished") {
    published = false;
  } else {
    published = true;
  }
  return published;
}

function generateConferenceLink(structure: EventStructure) {
  let conferenceLink;
  if (structure === "smallest") {
    conferenceLink = null;
  } else if (structure === "emptyStrings") {
    conferenceLink = "";
  } else if (structure === "unicode") {
    conferenceLink = "https://unicode.conference.link/Γ";
  } else {
    conferenceLink = faker.internet.url();
  }
  return conferenceLink;
}

function generateConferenceCode(structure: EventStructure) {
  let conferenceCode;
  if (structure === "smallest") {
    conferenceCode = null;
  } else if (structure === "emptyStrings") {
    conferenceCode = "";
  } else {
    conferenceCode = faker.datatype
      .number({ min: 100000, max: 999999 })
      .toString();
  }
  return conferenceCode;
}

function generateParticipantLimit(
  structure: EventStructure,
  index: number,
  numberOfStandardEntities: number
) {
  let participantLimit;
  const participantLimitSwitcher =
    index % 2 === 0 ? null : faker.datatype.number({ min: 1, max: 300 });
  if (structure === "smallest") {
    participantLimit = null;
  } else if (
    structure === "fullParticipants" ||
    structure === "overfullParticipants" ||
    structure === "largest"
  ) {
    participantLimit = numberOfStandardEntities / 2;
  } else {
    participantLimit = participantLimitSwitcher;
  }
  return participantLimit;
}

function generateParticipationFrom(index: number) {
  const timeDelta = {
    days: -22,
  };
  const participationFrom = generateFutureAndPastTimes(index, timeDelta);
  return participationFrom;
}

function generateParticipationUntil(index: number) {
  const timeDelta = {
    days: -1,
  };
  const participationUntil = generateFutureAndPastTimes(index, timeDelta);
  return participationUntil;
}

function generateVenueName(structure: EventStructure) {
  let venueName;
  if (structure === "smallest") {
    venueName = null;
  } else if (structure === "emptyStrings") {
    venueName = "";
  } else if (structure === "unicode") {
    venueName = "Unicode venue_Γ";
  } else if (structure === "largest") {
    venueName =
      "Large Event Space With A Large Name And Also Large Rooms - Almost Everything Is Large";
  } else {
    venueName = faker.company.name();
  }
  return venueName;
}

function generateVenueStreet(structure: EventStructure) {
  let venueStreet;
  if (structure === "smallest") {
    venueStreet = null;
  } else if (structure === "emptyStrings") {
    venueStreet = "";
  } else if (structure === "unicode") {
    venueStreet = "Unicodestreet_Γ";
  } else if (structure === "largest") {
    venueStreet = "Veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeerylongstreet";
  } else {
    venueStreet = faker.address.street();
  }
  return venueStreet;
}

function generateVenueStreetNumber(structure: EventStructure) {
  let venueStreetNumber;
  if (structure === "smallest") {
    venueStreetNumber = null;
  } else if (structure === "emptyStrings") {
    venueStreetNumber = "";
  } else if (structure === "largest") {
    venueStreetNumber = faker.datatype
      .number({ min: 1000, max: 9999 })
      .toString();
  } else {
    venueStreetNumber = faker.datatype.number({ min: 1, max: 999 }).toString();
  }
  return venueStreetNumber;
}

function generateVenueCity(structure: EventStructure) {
  let venueCity;
  if (structure === "smallest") {
    venueCity = null;
  } else if (structure === "emptyStrings") {
    venueCity = "";
  } else if (structure === "unicode") {
    venueCity = "Unicode City_Γ";
  } else if (structure === "largest") {
    venueCity = "The City Of The Greatest And Largest";
  } else {
    venueCity = faker.address.cityName();
  }
  return venueCity;
}

function generateVenueZipCode(structure: EventStructure) {
  let venueZipCode;
  if (structure === "smallest") {
    venueZipCode = null;
  } else if (structure === "emptyStrings") {
    venueZipCode = "";
  } else if (structure === "largest") {
    venueZipCode = faker.datatype
      .number({ min: 1000000000, max: 9999999999 })
      .toString();
  } else {
    venueZipCode = faker.address.zipCode();
  }
  return venueZipCode;
}

function generateCanceled(structure: EventStructure) {
  let canceled;
  if (structure === "canceled") {
    canceled = true;
  } else {
    canceled = false;
  }
  return canceled;
}

function setBackground(structure: EventStructure, bucketData: EventBucketData) {
  let backgroundPath;
  if (bucketData !== undefined) {
    if (structure === "smallest") {
      backgroundPath = null;
    } else {
      backgroundPath = bucketData.background.path;
    }
  } else {
    backgroundPath = null;
  }
  return backgroundPath;
}
