import type { Prisma, PrismaClient } from "@prisma/client";
import { prismaClient } from "~/prisma";
import {
  generateEventSlug,
  generateOrganizationSlug,
  generateProjectSlug,
  generateUsername,
} from "~/utils";
import { faker } from "@faker-js/faker";

type EntityData = {
  profile: Prisma.ProfileCreateArgs["data"];
  organization: Prisma.OrganizationCreateArgs["data"];
  project: Prisma.ProjectCreateArgs["data"];
  event: Prisma.EventCreateArgs["data"];
  award: Prisma.AwardCreateArgs["data"];
  document: Prisma.DocumentCreateArgs["data"];
};

type EntityTypeOnData<T> = T extends "profile"
  ? EntityData["profile"]
  : T extends "organization"
  ? EntityData["organization"]
  : T extends "project"
  ? EntityData["project"]
  : T extends "event"
  ? EntityData["event"]
  : T extends "award"
  ? EntityData["award"]
  : T extends "document"
  ? EntityData["document"]
  : never;

type EntityStructure = {
  developer: "Developer";
  standard: "Standard";
  largeTeam: "Large Team";
  smallTeam: "Small Team";
  eventCompanion: "Event Companion";
  projectCompanion: "Project Companion";
  network: "Network";
  private: "Private";
  public: "Public";
  small: "Small";
  emptyStrings: "Empty Strings";
  singleFieldMissing: "Single Field Missing";
  onlyOneField: "Only One Field";
  eventManager: "Event Manager";
  maker: "Maker";
  coordinator: "Coordinator";
  unicode: "Unicode";
  randomFieldSizes: "Random Field Sizes";
  largest: "Largest";
  depth2: "Depth2";
  depth3: "Depth3";
  fullParticipants: "Full Particpants";
  overfullParticipants: "Overfull Particpants";
  canceled: "Canceled";
  unpublished: "Unpublished";
  manyDocuments: "Many Documents";
  manyChildEvents: "Many Child Events";
  noConferenceLink: "NoConferenceLink";
  singleAwarded: "Single Awarded";
  multipleAwarded: "Multiple Awarded";
  manyResponsibleOrganizations: "Many Responsible Organizations";
  manySpeakers: "Many Speakers";
  manyParticipants: "Many Participants";
};

type EntityTypeOnStructure<T> = T extends "profile"
  ? EntityStructure[
      | "developer"
      | "standard"
      | "private"
      | "public"
      | "small"
      | "emptyStrings"
      | "singleFieldMissing"
      | "onlyOneField"
      | "eventManager"
      | "maker"
      | "coordinator"
      | "unicode"
      | "randomFieldSizes"
      | "largest"]
  : T extends "organization"
  ? EntityStructure[
      | "developer"
      | "standard"
      | "largeTeam"
      | "smallTeam"
      | "eventCompanion"
      | "projectCompanion"
      | "network"
      | "coordinator"
      | "private"
      | "public"
      | "small"
      | "emptyStrings"
      | "singleFieldMissing"
      | "onlyOneField"
      | "unicode"
      | "randomFieldSizes"
      | "largest"]
  : T extends "project"
  ? EntityStructure[
      | "developer"
      | "standard"
      | "small"
      | "largeTeam"
      | "smallTeam"
      | "emptyStrings"
      | "singleFieldMissing"
      | "onlyOneField"
      | "manyResponsibleOrganizations"
      | "unicode"
      | "randomFieldSizes"
      | "largest"]
  : T extends "event"
  ? EntityStructure[
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
      | "manyChildEvents"
      | "manyResponsibleOrganizations"
      | "manySpeakers"
      | "manyParticipants"
      | "small"
      | "emptyStrings"
      | "singleFieldMissing"
      | "onlyOneField"
      | "unicode"
      | "randomFieldSizes"
      | "largest"
      | "noConferenceLink"]
  : T extends "award"
  ? EntityStructure["standard" | "small" | "largest"]
  : T extends "document"
  ? EntityStructure["standard" | "small" | "largest"]
  : never;

type BucketData = {
  path: string;
  mimeType: string;
  filename: string;
  extension: string;
  sizeInMB: Number;
};

type EntityTypeOnBucketData<T> = T extends "document" ? BucketData : undefined;

export function setFakerSeed(seed: number) {
  faker.seed(seed);
}

export async function seedEntity<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entity: EntityTypeOnData<T>) {
  // TODO: fix union type issue (almost got the generic working, but thats too hard...)
  // What i wanted was: When i pass "profile" as type T then the passed entity must be of type Prisma.ProfileCreateArgs["data"]
  // @ts-ignore
  const result = await prismaClient[entityType].create({
    data: entity,
    select: { id: true },
  });
  return result.id;
}

export function getEntityData<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  index: number,
  bucketData: EntityTypeOnBucketData<T>
) {
  const entityData /*: unknown <-- TODO: if type issue doesnt resolve */ = {
    username: generateUsernameByTypeAndStructure<T>(
      entityType,
      entityStructure
    ),
    title: generateTitleByTypeAndStructure<T>(entityType, entityStructure),
    date: generateDateByTypeAndStructure<T>(entityType, index),
    shortTitle: generateShortTitleByTypeAndStructure<T>(
      entityType,
      entityStructure
    ),
    path: bucketData ? bucketData.path : undefined, // document required
    mimeType: bucketData ? bucketData.mimeType : undefined, // document required
    filename: bucketData ? bucketData.filename : undefined, // document required
    extension: bucketData ? bucketData.extension : undefined, // document required
    sizeInMB: bucketData ? bucketData.sizeInMB : undefined, // document required
    name: generateNameByTypeAndStructure<T>(entityType, entityStructure),
    slug: generateSlugByTypeAndStructure<T>(entityType, entityStructure),
    headline: "", // project
    excerpt: "", // project
    startTime: new Date(), // event required
    endTime: new Date(), // event required
    description: "", // event, project, document
    subline: "", // event, award required
    published: true, // event default false
    conferenceLink: "", // event
    conferenceCode: "", // event
    participantLimit: 0, // event
    participationFrom: new Date(), // event default now
    participationUntil: new Date(), // event required
    venueName: "", // event
    venueStreet: "", // event
    venueStreetNumber: "", // event
    venueCity: "", // event
    venueZipCode: "", // event
    canceled: false, // event
    email: "", // profile required, organization, project
    phone: "", // profile, organization, project
    street: "", // organization, project
    streetNumber: "", // organization, project
    city: "", // organization, project
    zipCode: "", // organization, project
    website: "", // profile, organization, project
    logo: "", // organization, project, award required
    avatar: "", // profile
    background: "", // profile, organization, event, project
    facebook: "", // profile, organization, project
    linkedin: "", // profile, organization, project
    twitter: "", // profile, organization, project
    xing: "", // profile, organization, project
    instagram: "", // profile, organization, project
    youtube: "", // profile, organization, project
    bio: "", // profile, organization
    quote: "", // organization
    quoteAuthor: "", // organization
    quoteAuthorInformation: "", // organization
    supportedBy: [], // organization
    skills: [], // profile
    interests: [], // profile
    academicTitle: "", // profile
    firstName: "", // profile required
    lastName: "", // profile required
    publicFields: [], // profile, organization
    termsAccepted: true, // profile required
    position: "", // profile
  };
  return entityData as EntityTypeOnData<T>;
}

function generateUsernameByTypeAndStructure<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile required unique
  let username;
  if (entityType === "profile") {
    if (entityStructure === "Developer") {
      username = generateUsername("_Developer", "Profile");
    } else {
      username = generateUsername(entityStructure, "Profile");
    }
  }
  return username;
}

function generateTitleByTypeAndStructure<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // award required, document
  let title;
  if (entityType === "award") {
    if (entityStructure === "Standard") {
      title = "Best Practice Project";
    }
    if (entityStructure === "Small") {
      title = "A-Level";
    }
    if (entityStructure === "Largest") {
      title = "Best Practice Project In The Education Sector";
    }
  }
  if (entityType === "document") {
    if (entityStructure === "Standard") {
      title = "Standard document title";
    }
    if (entityStructure === "Small") {
      title = null;
    }
    if (entityStructure === "Largest") {
      title = "A very large document title";
    }
  }
  return title;
}

function generateDateByTypeAndStructure<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, index: number) {
  // award
  let date;
  if (entityType === "award") {
    date = new Date(`01-01-202${index}`);
  }
  return date;
}

function generateShortTitleByTypeAndStructure<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // award
  let shortTitle;
  if (entityType === "award") {
    if (entityStructure === "Standard") {
      shortTitle = "Best Practice";
    }
    if (entityStructure === "Small") {
      shortTitle = "A";
    }
    if (entityStructure === "Largest") {
      shortTitle = "Best Practice Education";
    }
  }
  return shortTitle;
}

function generateNameByTypeAndStructure<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization required, event required, project required
  let name;
  if (
    entityType === "organization" ||
    entityType === "event" ||
    entityType === "project"
  ) {
    if (entityStructure === "Developer") {
      name = `_${entityStructure} ${entityType.replace(/^./, function (match) {
        return match.toUpperCase();
      })}`;
    } else {
      name = `${entityStructure} ${entityType.replace(/^./, function (match) {
        return match.toUpperCase();
      })}`;
    }
  }
  return name;
}

function generateSlugByTypeAndStructure<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization required unique, event required unique, project required unique, award required unique
  let name;
  if (entityType === "organization") {
    if (entityStructure === "Developer") {
      name = generateOrganizationSlug("_Developer Organization");
    } else {
      name = generateOrganizationSlug(`${entityStructure} Organization`);
    }
  }
  if (entityType === "event") {
    if (entityStructure === "Developer") {
      name = generateEventSlug("_Developer Event");
    } else {
      name = generateEventSlug(`${entityStructure} Event`);
    }
  }
  if (entityType === "project") {
    if (entityStructure === "Developer") {
      name = generateProjectSlug("_Developer Project");
    } else {
      name = generateProjectSlug(`${entityStructure} Event`);
    }
  }
  return name;
}

seedEntity<"profile">("profile", {
  email: "someuser",
  username: "",
  firstName: "",
  lastName: "",
  termsAccepted: true,
});

const event = getEntityData<"event">("event", "Standard", 0, undefined);
