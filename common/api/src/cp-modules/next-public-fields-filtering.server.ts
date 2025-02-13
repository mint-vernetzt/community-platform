import type { Event, Organization, Profile, Project } from "@prisma/client";
import type { EntitySubset } from "./types";

export type ProfileWithRelations = Profile & {
  // TODO: fix type issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  areas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  memberOf: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  offers: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participatedEvents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seekings: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contributedEvents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamMemberOfEvents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamMemberOfProjects: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  waitingForEvents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profileVisibility: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notificationSettings: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  administeredEvents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  administeredOrganizations: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  administeredProjects: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backgroundImage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profileAbuseReport: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organizationAbuseReport: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventAbuseReport: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projectAbuseReport: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abuseReports: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  joinOrganizationRequests: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  joinOrganizationInvites: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _count: any;
};

export function filterProfileByVisibility<
  T extends EntitySubset<ProfileWithRelations, T> &
    Pick<ProfileWithRelations, "profileVisibility">
>(profile: T) {
  // TODO: Fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredFields: { [key: string]: any } = {};
  for (const key in profile.profileVisibility) {
    if (key !== "id" && key !== "profileId") {
      // Fields in Profile with type String
      if (
        key === "username" ||
        key === "email" ||
        key === "firstName" ||
        key === "lastName"
      ) {
        filteredFields[key] =
          profile.profileVisibility[key] === true ? profile[key] : "";
      }
      // Fields in Profile with type []
      else if (
        key === "skills" ||
        key === "interests" ||
        key === "areas" ||
        key === "memberOf" ||
        key === "offers" ||
        key === "participatedEvents" ||
        key === "seekings" ||
        key === "contributedEvents" ||
        key === "teamMemberOfEvents" ||
        key === "teamMemberOfProjects" ||
        key === "administeredEvents" ||
        key === "administeredOrganizations" ||
        key === "administeredProjects" ||
        key === "profileAbuseReport" ||
        key === "organizationAbuseReport" ||
        key === "eventAbuseReport" ||
        key === "projectAbuseReport" ||
        key === "abuseReports" ||
        key === "joinOrganizationRequests" ||
        key === "joinOrganizationInvites" ||
        key === "waitingForEvents"
      ) {
        filteredFields[key] =
          profile.profileVisibility[key] === true ? profile[key] : [];
      }
      // Fields in Profile with type DateTime
      else if (
        key === "createdAt" ||
        key === "termsAcceptedAt" ||
        key === "updatedAt"
      ) {
        filteredFields[key] =
          profile.profileVisibility[key] === true
            ? profile[key]
            : new Date("1970-01-01T00:00:00.000Z");
      }
      // Fields in Profile with type Boolean
      else if (key === "termsAccepted") {
        filteredFields[key] =
          profile.profileVisibility[key] === true ? profile[key] : true;
      }
      // Fields in Profile with type Int
      else if (key === "score") {
        filteredFields[key] =
          profile.profileVisibility[key] === true ? profile[key] : 0;
      }
      // All other fields in Profile that are optional (String? or Relation?)
      else if (
        key === "phone" ||
        key === "email2" ||
        key === "website" ||
        key === "avatar" ||
        key === "background" ||
        key === "facebook" ||
        key === "linkedin" ||
        key === "twitter" ||
        key === "xing" ||
        key === "bio" ||
        key === "academicTitle" ||
        key === "position" ||
        key === "instagram" ||
        key === "backgroundImage" ||
        key === "backgroundImageId" ||
        key === "notificationSettings" ||
        key === "youtube" ||
        key === "mastodon" ||
        key === "tiktok"
      ) {
        filteredFields[key] =
          profile.profileVisibility[key] === true ? profile[key] : null;
      } else {
        console.error(
          `The ProfileVisibility key ${key} was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method.`
        );
        // TODO: Set unknown keys to null (Typesafe!)
      }
    }
  }
  const filteredProfile: T = { ...profile, ...filteredFields };

  return filteredProfile;
}

type OrganizationWithRelations = Organization & {
  // TODO: Fix type issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  areas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  focuses: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkMembers: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  memberOf: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamMembers: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  types: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkTypes: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responsibleForEvents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responsibleForProject: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organizationVisibility: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admins: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backgroundImage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abuseReports: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profileJoinRequests: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profileJoinInvites: any;
};

export function filterOrganizationByVisibility<
  T extends EntitySubset<OrganizationWithRelations, T> &
    Pick<OrganizationWithRelations, "organizationVisibility">
>(organization: T) {
  // TODO: Fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredFields: { [key: string]: any } = {};
  for (const key in organization.organizationVisibility) {
    if (key !== "id" && key !== "organizationId") {
      // Fields in Organization with type String
      if (key === "name" || key === "slug") {
        filteredFields[key] =
          organization.organizationVisibility[key] === true
            ? organization[key]
            : "";
      }
      // Fields in Organization with type []
      else if (
        key === "supportedBy" ||
        key === "areas" ||
        key === "focuses" ||
        key === "networkMembers" ||
        key === "memberOf" ||
        key === "teamMembers" ||
        key === "types" ||
        key === "networkTypes" ||
        key === "responsibleForEvents" ||
        key === "admins" ||
        key === "abuseReports" ||
        key === "profileJoinRequests" ||
        key === "profileJoinInvites" ||
        key === "responsibleForProject"
      ) {
        filteredFields[key] =
          organization.organizationVisibility[key] === true
            ? organization[key]
            : [];
      }
      // Fields in Organization with type DateTime
      else if (key === "createdAt" || key === "updatedAt") {
        filteredFields[key] =
          organization.organizationVisibility[key] === true
            ? organization[key]
            : new Date("1970-01-01T00:00:00.000Z");
      }
      // Fields in Organization with type Int
      else if (key === "score") {
        filteredFields[key] =
          organization.organizationVisibility[key] === true
            ? organization[key]
            : 0;
      }
      // All other fields in Organization that are optional (String? or Relation?)
      else if (
        key === "email" ||
        key === "phone" ||
        key === "street" ||
        key === "city" ||
        key === "website" ||
        key === "logo" ||
        key === "background" ||
        key === "facebook" ||
        key === "linkedin" ||
        key === "twitter" ||
        key === "xing" ||
        key === "bio" ||
        key === "quote" ||
        key === "quoteAuthor" ||
        key === "quoteAuthorInformation" ||
        key === "streetNumber" ||
        key === "zipCode" ||
        key === "instagram" ||
        key === "backgroundImage" ||
        key === "backgroundImageId" ||
        key === "youtube" ||
        key === "mastodon" ||
        key === "tiktok"
      ) {
        filteredFields[key] =
          organization.organizationVisibility[key] === true
            ? organization[key]
            : null;
      } else {
        console.error(
          `The OrganizationVisibility key ${key} was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method.`
        );
      }
    }
  }
  const filteredOrganization: T = { ...organization, ...filteredFields };

  return filteredOrganization;
}

type EventWithRelations = Event & {
  // TODO: Fix type issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  areas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  types: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  experienceLevel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentEvent: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  childEvents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  focuses: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responsibleOrganizations: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  speakers: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tags: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetGroups: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventTargetGroups: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamMembers: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  waitingList: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventVisibility: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admins: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backgroundImage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abuseReports: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _count: any;
};

export function filterEventByVisibility<
  T extends EntitySubset<EventWithRelations, T> &
    Pick<EventWithRelations, "eventVisibility">
>(event: T) {
  // TODO: Fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredFields: { [key: string]: any } = {};
  for (const key in event.eventVisibility) {
    if (key !== "id" && key !== "eventId") {
      // Fields in Event with type String
      if (key === "name" || key === "slug") {
        filteredFields[key] =
          event.eventVisibility[key] === true ? event[key] : "";
      }
      // Fields in Event with type []
      else if (
        key === "areas" ||
        key === "documents" ||
        key === "types" ||
        key === "childEvents" ||
        key === "focuses" ||
        key === "participants" ||
        key === "responsibleOrganizations" ||
        key === "speakers" ||
        key === "tags" ||
        key === "targetGroups" || // legacy
        key === "eventTargetGroups" ||
        key === "teamMembers" ||
        key === "admins" ||
        key === "abuseReports" ||
        key === "waitingList"
      ) {
        filteredFields[key] =
          event.eventVisibility[key] === true ? event[key] : [];
      }
      // Fields in Event with type DateTime
      else if (
        key === "startTime" ||
        key === "endTime" ||
        key === "createdAt" ||
        key === "updatedAt" ||
        key === "participationUntil" ||
        key === "participationFrom"
      ) {
        filteredFields[key] =
          event.eventVisibility[key] === true
            ? event[key]
            : new Date("1970-01-01T00:00:00.000Z");
      }
      // Fields in Profile with type Boolean
      else if (key === "published" || key === "canceled") {
        filteredFields[key] =
          event.eventVisibility[key] === true ? event[key] : true;
      }
      // All other fields in Event that are optional (String?, Int?, Relation?, etc...)
      else if (
        key === "description" ||
        key === "background" || // legacy
        key === "conferenceLink" ||
        key === "conferenceCode" ||
        key === "participantLimit" ||
        key === "venueName" ||
        key === "venueStreet" ||
        key === "venueStreetNumber" ||
        key === "venueCity" ||
        key === "venueZipCode" ||
        key === "subline" ||
        key === "experienceLevel" ||
        key === "experienceLevelId" ||
        key === "parentEvent" ||
        key === "parentEventId" ||
        key === "stage" ||
        key === "backgroundImage" ||
        key === "backgroundImageId" ||
        key === "stageId"
      ) {
        filteredFields[key] =
          event.eventVisibility[key] === true ? event[key] : null;
      } else {
        console.error(
          `The EventVisibility key ${key} was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method.`
        );
      }
    }
  }
  const filteredEvent: T = { ...event, ...filteredFields };

  return filteredEvent;
}

type ProjectWithRelations = Project & {
  // TODO: Fix type issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  awards: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disciplines: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalDisciplines: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responsibleOrganizations: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetGroups: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projectTargetGroups: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  specialTargetGroups: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formats: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  financings: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  areas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamMembers: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projectVisibility: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admins: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  images: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backgroundImage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abuseReports: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _count: any;
};

export function filterProjectByVisibility<
  T extends EntitySubset<ProjectWithRelations, T> &
    Pick<ProjectWithRelations, "projectVisibility">
>(project: T) {
  // TODO: Fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredFields: { [key: string]: any } = {};
  for (const key in project.projectVisibility) {
    if (key !== "id" && key !== "projectId") {
      // Fields in Project with type String
      if (key === "name" || key === "slug") {
        filteredFields[key] =
          project.projectVisibility[key] === true ? project[key] : "";
      }
      // Fields in Project with type []
      else if (
        key === "awards" ||
        key === "disciplines" ||
        key === "additionalDisciplines" ||
        key === "furtherDisciplines" ||
        key === "specialTargetGroups" ||
        key === "responsibleOrganizations" ||
        key === "targetGroups" || // legacy
        key === "projectTargetGroups" ||
        key === "formats" ||
        key === "financings" ||
        key === "areas" ||
        key === "images" ||
        key === "documents" ||
        key === "furtherFormats" ||
        key === "admins" ||
        key === "abuseReports" ||
        key === "teamMembers"
      ) {
        filteredFields[key] =
          project.projectVisibility[key] === true ? project[key] : [];
      }
      // Fields in Project with type DateTime
      else if (key === "createdAt" || key === "updatedAt") {
        filteredFields[key] =
          project.projectVisibility[key] === true
            ? project[key]
            : new Date("1970-01-01T00:00:00.000Z");
      }
      // All other fields in Project that are optional (String?, Relation?, etc...)
      else if (
        key === "logo" ||
        key === "background" || // legacy
        key === "headline" ||
        key === "subline" ||
        key === "excerpt" ||
        key === "description" || // legacy
        key === "furtherDescription" ||
        key === "email" ||
        key === "phone" ||
        key === "website" ||
        key === "contactName" ||
        key === "street" ||
        key === "streetNumber" ||
        key === "streetNumberAddition" ||
        key === "zipCode" ||
        key === "facebook" ||
        key === "linkedin" ||
        key === "twitter" ||
        key === "youtube" ||
        key === "instagram" ||
        key === "xing" ||
        key === "mastodon" ||
        key === "tiktok" ||
        key === "idea" ||
        key === "goals" ||
        key === "implementation" ||
        key === "targeting" ||
        key === "hints" ||
        key === "video" ||
        key === "videoSubline" ||
        key === "jobFillings" ||
        key === "furtherJobFillings" ||
        key === "yearlyBudget" ||
        key === "furtherFinancings" ||
        key === "technicalRequirements" ||
        key === "furtherTechnicalRequirements" ||
        key === "roomSituation" ||
        key === "furtherRoomSituation" ||
        key === "timeframe" ||
        key === "participantLimit" ||
        key === "targetGroupAdditions" ||
        key === "backgroundImage" ||
        key === "backgroundImageId" ||
        key === "city"
      ) {
        filteredFields[key] =
          project.projectVisibility[key] === true ? project[key] : null;
      } else {
        console.error(
          `The ProjectVisibility key ${key} was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method.`
        );
      }
    }
  }
  const filteredProject: T = { ...project, ...filteredFields };

  return filteredProject;
}
