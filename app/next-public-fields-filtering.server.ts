import type { Event, Organization, Profile, Project } from "@prisma/client";
import type { EntitySubset } from "./lib/utils/types";

type ProfileWithRelations = Profile & {
  areas: any;
  memberOf: any;
  offers: any;
  participatedEvents: any;
  seekings: any;
  contributedEvents: any;
  teamMemberOfEvents: any;
  teamMemberOfProjects: any;
  waitingForEvents: any;
  profileVisibility: any;
  notificationSettings: any;
  administeredEvents: any;
  administeredOrganizations: any;
  administeredProjects: any;
  backgroundImage: any;
  profileAbuseReport: any;
  organizationAbuseReport: any;
  eventAbuseReport: any;
  projectAbuseReport: any;
  abuseReports: any;
  joinOrganizationRequests: any;
  joinOrganizationInvites: any;
  claimOrganizationRequests: any;
  _count: any;
};

export function filterProfileByVisibility<
  T extends EntitySubset<ProfileWithRelations, T> &
    Pick<ProfileWithRelations, "profileVisibility">,
>(profile: T) {
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
        key === "claimOrganizationRequests" ||
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
        key === "bioRTEState" ||
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
  areas: any;
  focuses: any;
  networkMembers: any;
  memberOf: any;
  teamMembers: any;
  types: any;
  networkTypes: any;
  responsibleForEvents: any;
  responsibleForProject: any;
  organizationVisibility: any;
  admins: any;
  backgroundImage: any;
  abuseReports: any;
  profileJoinRequests: any;
  profileJoinInvites: any;
  claimRequests: any;
  _count: any;
};

export function filterOrganizationByVisibility<
  T extends EntitySubset<OrganizationWithRelations, T> &
    Pick<OrganizationWithRelations, "organizationVisibility">,
>(organization: T) {
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
        key === "claimRequests" ||
        key === "responsibleForProject"
      ) {
        filteredFields[key] =
          organization.organizationVisibility[key] === true
            ? organization[key]
            : [];
      }
      // Fields in Organization with type Boolean
      else if (key === "shadow") {
        filteredFields[key] =
          organization.organizationVisibility[key] === true
            ? organization[key]
            : true;
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
        key === "bioRTEState" ||
        key === "quote" ||
        key === "quoteAuthor" ||
        key === "quoteAuthorInformation" ||
        key === "shadowSource" ||
        key === "streetNumber" || // legacy
        key === "zipCode" ||
        key === "longitude" ||
        key === "latitude" ||
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
  areas: any;
  documents: any;
  types: any;
  experienceLevel: any;
  parentEvent: any;
  childEvents: any;
  stage: any;
  focuses: any;
  participants: any;
  responsibleOrganizations: any;
  speakers: any;
  tags: any;
  targetGroups: any;
  eventTargetGroups: any;
  teamMembers: any;
  waitingList: any;
  eventVisibility: any;
  admins: any;
  backgroundImage: any;
  abuseReports: any;
  _count: any;
};

export function filterEventByVisibility<
  T extends EntitySubset<EventWithRelations, T> &
    Pick<EventWithRelations, "eventVisibility">,
>(event: T) {
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
        key === "descriptionRTEState" ||
        key === "background" || // legacy
        key === "conferenceLink" ||
        key === "conferenceCode" ||
        key === "participantLimit" ||
        key === "venueName" ||
        key === "venueStreet" ||
        key === "venueStreetNumber" || // legacy
        key === "venueCity" ||
        key === "venueZipCode" ||
        key === "venueLongitude" ||
        key === "venueLatitude" ||
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
  awards: any;
  disciplines: any;
  additionalDisciplines: any;
  responsibleOrganizations: any;
  targetGroups: any;
  projectTargetGroups: any;
  specialTargetGroups: any;
  formats: any;
  financings: any;
  areas: any;
  teamMembers: any;
  projectVisibility: any;
  admins: any;
  images: any;
  documents: any;
  backgroundImage: any;
  abuseReports: any;
  _count: any;
};

export function filterProjectByVisibility<
  T extends EntitySubset<ProjectWithRelations, T> &
    Pick<ProjectWithRelations, "projectVisibility">,
>(project: T) {
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
        key === "furtherDescriptionRTEState" ||
        key === "email" ||
        key === "phone" ||
        key === "website" ||
        key === "contactName" ||
        key === "street" ||
        key === "streetNumber" || // legacy
        key === "streetNumberAddition" || // legacy
        key === "zipCode" ||
        key === "longitude" ||
        key === "latitude" ||
        key === "facebook" ||
        key === "linkedin" ||
        key === "twitter" ||
        key === "youtube" ||
        key === "instagram" ||
        key === "xing" ||
        key === "mastodon" ||
        key === "tiktok" ||
        key === "idea" ||
        key === "ideaRTEState" ||
        key === "goals" ||
        key === "goalsRTEState" ||
        key === "implementation" ||
        key === "implementationRTEState" ||
        key === "targeting" ||
        key === "targetingRTEState" ||
        key === "hints" ||
        key === "hintsRTEState" ||
        key === "video" ||
        key === "videoSubline" ||
        key === "jobFillings" ||
        key === "jobFillingsRTEState" ||
        key === "furtherJobFillings" ||
        key === "furtherJobFillingsRTEState" ||
        key === "yearlyBudget" ||
        key === "furtherFinancings" ||
        key === "furtherFinancingsRTEState" ||
        key === "technicalRequirements" ||
        key === "technicalRequirementsRTEState" ||
        key === "furtherTechnicalRequirements" ||
        key === "furtherTechnicalRequirementsRTEState" ||
        key === "roomSituation" ||
        key === "roomSituationRTEState" ||
        key === "furtherRoomSituation" ||
        key === "furtherRoomSituationRTEState" ||
        key === "timeframe" ||
        key === "timeframeRTEState" ||
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
