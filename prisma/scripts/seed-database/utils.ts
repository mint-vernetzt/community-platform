import type { Prisma, PrismaClient } from "@prisma/client";
import { prismaClient } from "~/prisma";
import { generateUsername } from "~/utils";
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
  developer: "developer";
  standard: "standard";
  private: "private";
  public: "public";
  smallest: "smallest";
  emptyStrings: "emptyStrings";
  singleFieldMissing: "singleFieldMissing";
  onlyOneField: "onlyOneField";
  unicode: "unicode";
  randomFieldSizes: "randomFieldSizes";
  largest: "largest";
  depth2: "depth2";
  depth3: "depth3";
  participantLimit: "participantLimit";
  canceled: "canceled";
  unpublished: "unpublished";
  noConferenceLink: "noConferenceLink";
};

type EntityTypeOnStructure<T> = T extends "profile"
  ? EntityStructure[
      | "developer"
      | "standard"
      | "private"
      | "public"
      | "smallest"
      | "emptyStrings"
      | "singleFieldMissing"
      | "onlyOneField"
      | "unicode"
      | "randomFieldSizes"
      | "largest"]
  : T extends "organization"
  ? EntityStructure[
      | "developer"
      | "standard"
      | "private"
      | "public"
      | "smallest"
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
      | "smallest"
      | "emptyStrings"
      | "singleFieldMissing"
      | "onlyOneField"
      | "unicode"
      | "randomFieldSizes"
      | "largest"]
  : T extends "event"
  ? EntityStructure[
      | "developer"
      | "standard"
      | "depth2"
      | "depth3"
      | "participantLimit"
      | "canceled"
      | "unpublished"
      | "smallest"
      | "emptyStrings"
      | "singleFieldMissing"
      | "onlyOneField"
      | "unicode"
      | "randomFieldSizes"
      | "largest"
      | "noConferenceLink"]
  : T extends "award"
  ? EntityStructure["standard" | "smallest" | "largest"]
  : T extends "document"
  ? EntityStructure["standard" | "smallest" | "largest"]
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
  const result = await prismaClient[entityType].create(entity);
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
      entityStructure,
      index
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
    name: "", // organization required, event required, project required
    slug: "", // organization required unique, event required unique, project required unique, award required unique
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
>(entityType: T, entityStructure: EntityTypeOnStructure<T>, index: number) {
  // profile required unique
  let username;
  if (entityType === "profile") {
    if (entityStructure === "developer") {
      username = generateUsername("_Developer", `Profile ${index}`);
    } else {
      username = generateUsername(
        `${entityStructure.replace(/^./, function (match) {
          return match.toUpperCase();
        })}`,
        `Profile ${index}`
      );
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
    if (entityStructure === "standard") {
      title = "Best Practice Project";
    }
    if (entityStructure === "smallest") {
      title = "A-Level";
    }
    if (entityStructure === "largest") {
      title = "Best Practice Project In The Education Sector";
    }
  }
  if (entityType === "document") {
    if (entityStructure === "standard") {
      title = "Standard document title";
    }
    if (entityStructure === "smallest") {
      title = null;
    }
    if (entityStructure === "largest") {
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
    if (entityStructure === "standard") {
      shortTitle = "Best Practice";
    }
    if (entityStructure === "smallest") {
      shortTitle = "A";
    }
    if (entityStructure === "largest") {
      shortTitle = "Best Practice Education";
    }
  }
  return shortTitle;
}

seedEntity<"profile">("profile", {
  email: "someuser",
  username: "",
  firstName: "",
  lastName: "",
  termsAccepted: true,
});

const event = getEntityData<"document">("document", "standard", 0, {
  path: "",
  mimeType: "",
  filename: "",
  extension: "",
  sizeInMB: 0.5,
});
