import type { Prisma, PrismaClient } from "@prisma/client";
import { prismaClient } from "~/prisma";

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
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  const entityData /*: unknown <-- TODO: if type issue doesnt resolve */ = {
    username: "", // profile required unique
    title: "", // award required, document
    date: new Date(), // award default now
    shortTitle: "", // award
    path: "", // document required
    mimeType: "", // document required
    filename: "", // document required
    extension: "", // document required
    sizeInMB: 0.1, // document required
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

seedEntity<"profile">("profile", {
  email: "someuser",
  username: "",
  firstName: "",
  lastName: "",
  termsAccepted: true,
});

const event = getEntityData<"event">("event", "standard");
