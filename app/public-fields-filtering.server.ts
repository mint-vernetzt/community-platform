import type { Event, Organization, Profile, Project } from "@prisma/client";
import { notFound } from "remix-utils";
import type { EntitySubset } from "./lib/utils/types";
import { prismaClient } from "./prisma.server";

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
  administeredEvents: any;
  administeredOrganizations: any;
  administeredProjects: any;
  backgroundImage: any;
  _count: any;
};

export async function filterListOfProfilesByVisibility<
  T extends EntitySubset<ProfileWithRelations, T>
>(profiles: T[]) {
  const filteredProfileList: T[] = await Promise.all(
    profiles.map(async (profile) => {
      const filteredProfile: T = await filterProfileByVisibility<T>(profile);
      return filteredProfile;
    })
  );
  return filteredProfileList;
}

export async function filterProfileByVisibility<
  T extends EntitySubset<ProfileWithRelations, T>
>(profile: T) {
  const profileVisibility = await prismaClient.profileVisibility.findFirst({
    where: {
      profile: {
        id: profile.id,
      },
    },
  });
  if (profileVisibility === null) {
    throw notFound({ message: "Profile visibilities not found." });
  }

  for (const key in profile) {
    if (!profileVisibility.hasOwnProperty(key)) {
      console.error(
        `profile.${key} is not present in the profile visibilities.`
      );
    }
  }
  const filteredFields: { [key: string]: any } = {};
  for (const key in profileVisibility) {
    if (key !== "id" && key !== "profileId") {
      // Fields in Profile with type String
      if (
        key === "username" ||
        key === "email" ||
        key === "firstName" ||
        key === "lastName"
      ) {
        filteredFields[key] =
          profileVisibility[key] === true ? profile[key] : "";
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
        key === "waitingForEvents"
      ) {
        filteredFields[key] =
          profileVisibility[key] === true ? profile[key] : [];
      }
      // Fields in Profile with type DateTime
      else if (
        key === "createdAt" ||
        key === "termsAcceptedAt" ||
        key === "updatedAt"
      ) {
        filteredFields[key] =
          profileVisibility[key] === true
            ? profile[key]
            : new Date("1970-01-01T00:00:00.000Z");
      }
      // Fields in Profile with type Boolean
      else if (key === "termsAccepted") {
        filteredFields[key] =
          profileVisibility[key] === true ? profile[key] : true;
      }
      // Fields in Profile with type Int
      else if (key === "score") {
        filteredFields[key] =
          profileVisibility[key] === true ? profile[key] : 0;
      }
      // All other fields in Profile that are optional (String? or Relation?)
      else if (
        key === "phone" ||
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
        key === "youtube"
      ) {
        filteredFields[key] =
          profileVisibility[key] === true ? profile[key] : null;
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
  responsibleForEvents: any;
  responsibleForProject: any;
  organizationVisibility: any;
  admins: any;
  backgroundImage: any;
};
export async function filterListOfOrganizationsByVisibility<
  T extends EntitySubset<OrganizationWithRelations, T>
>(organizations: T[]) {
  const filteredOrganizationList: T[] = await Promise.all(
    organizations.map(async (organization) => {
      const filteredOrganization: T = await filterOrganizationByVisibility<T>(
        organization
      );
      return filteredOrganization;
    })
  );
  return filteredOrganizationList;
}

export async function filterOrganizationByVisibility<
  T extends EntitySubset<OrganizationWithRelations, T>
>(organization: T) {
  const organizationVisibility =
    await prismaClient.organizationVisibility.findFirst({
      where: {
        organization: {
          id: organization.id,
        },
      },
    });

  if (organizationVisibility === null) {
    throw notFound({ message: "Organization visibilities not found." });
  }
  for (const key in organization) {
    if (!organizationVisibility.hasOwnProperty(key)) {
      console.error(
        `organization.${key} is not present in the organization visibilities.`
      );
    }
  }
  const filteredFields: { [key: string]: any } = {};
  for (const key in organizationVisibility) {
    if (key !== "id" && key !== "organizationId") {
      // Fields in Organization with type String
      if (key === "name" || key === "slug") {
        filteredFields[key] =
          organizationVisibility[key] === true ? organization[key] : "";
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
        key === "responsibleForEvents" ||
        key === "admins" ||
        key === "responsibleForProject"
      ) {
        filteredFields[key] =
          organizationVisibility[key] === true ? organization[key] : [];
      }
      // Fields in Organization with type DateTime
      else if (key === "createdAt" || key === "updatedAt") {
        filteredFields[key] =
          organizationVisibility[key] === true
            ? organization[key]
            : new Date("1970-01-01T00:00:00.000Z");
      }
      // Fields in Organization with type Int
      else if (key === "score") {
        filteredFields[key] =
          organizationVisibility[key] === true ? organization[key] : 0;
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
        key === "youtube"
      ) {
        filteredFields[key] =
          organizationVisibility[key] === true ? organization[key] : null;
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
  teamMembers: any;
  waitingList: any;
  eventVisibility: any;
  admins: any;
  backgroundImage: any;
  _count: any;
};

export async function filterListOfEventsByVisibility<
  T extends EntitySubset<EventWithRelations, T>
>(events: T[]) {
  const filteredEventList: T[] = await Promise.all(
    events.map(async (event) => {
      const filteredEvent: T = await filterEventByVisibility<T>(event);
      return filteredEvent;
    })
  );
  return filteredEventList;
}

export async function filterEventByVisibility<
  T extends EntitySubset<EventWithRelations, T>
>(event: T) {
  const exceptions = ["_count"];

  const eventVisibility = await prismaClient.eventVisibility.findFirst({
    where: {
      event: {
        id: event.id,
      },
    },
  });

  if (eventVisibility === null) {
    throw notFound({ message: "Event visibilities not found." });
  }

  for (const key in event) {
    if (!exceptions.includes(key) && !eventVisibility.hasOwnProperty(key)) {
      console.error(`event.${key} is not present in the event visibilities.`);
    }
  }

  const filteredFields: { [key: string]: any } = {};
  for (const key in eventVisibility) {
    if (key !== "id" && key !== "eventId") {
      // Fields in Event with type String
      if (key === "name" || key === "slug") {
        filteredFields[key] = eventVisibility[key] === true ? event[key] : "";
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
        key === "targetGroups" ||
        key === "teamMembers" ||
        key === "admins" ||
        key === "waitingList"
      ) {
        filteredFields[key] = eventVisibility[key] === true ? event[key] : [];
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
          eventVisibility[key] === true
            ? event[key]
            : new Date("1970-01-01T00:00:00.000Z");
      }
      // Fields in Profile with type Boolean
      else if (key === "published" || key === "canceled") {
        filteredFields[key] = eventVisibility[key] === true ? event[key] : true;
      }
      // All other fields in Event that are optional (String?, Int?, Relation?, etc...)
      else if (
        key === "description" ||
        key === "background" ||
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
        filteredFields[key] = eventVisibility[key] === true ? event[key] : null;
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
  specialTargetGroups: any;
  formats: any;
  financings: any;
  areas: any;
  teamMembers: any;
  projectVisibility: any;
  admins: any;
  backgroundImage: any;
  _count: any;
};

export async function filterListOfProjectsByVisibility<
  T extends EntitySubset<ProjectWithRelations, T>
>(projects: T[]) {
  const filteredProjectList: T[] = await Promise.all(
    projects.map(async (project) => {
      const filteredProject: T = await filterProjectByVisibility<T>(project);
      return filteredProject;
    })
  );
  return filteredProjectList;
}

export async function filterProjectByVisibility<
  T extends EntitySubset<ProjectWithRelations, T>
>(project: T) {
  const projectVisibility = await prismaClient.projectVisibility.findFirst({
    where: {
      project: {
        id: project.id,
      },
    },
  });

  if (projectVisibility === null) {
    throw notFound({ message: "Project visibilities not found." });
  }
  for (const key in project) {
    if (!projectVisibility.hasOwnProperty(key)) {
      console.error(
        `project.${key} is not present in the project visibilities.`
      );
    }
  }
  const filteredFields: { [key: string]: any } = {};
  for (const key in projectVisibility) {
    if (key !== "id" && key !== "projectId") {
      // Fields in Project with type String
      if (key === "name" || key === "slug") {
        filteredFields[key] =
          projectVisibility[key] === true ? project[key] : "";
      }
      // Fields in Project with type []
      else if (
        key === "awards" ||
        key === "disciplines" ||
        key === "additionalDisciplines" ||
        key === "furtherDisciplines" ||
        key === "specialTargetGroups" ||
        key === "responsibleOrganizations" ||
        key === "targetGroups" ||
        key === "formats" ||
        key === "financings" ||
        key === "areas" ||
        key === "furtherFormats" ||
        key === "admins" ||
        key === "teamMembers"
      ) {
        filteredFields[key] =
          projectVisibility[key] === true ? project[key] : [];
      }
      // Fields in Project with type DateTime
      else if (key === "createdAt" || key === "updatedAt") {
        filteredFields[key] =
          projectVisibility[key] === true
            ? project[key]
            : new Date("1970-01-01T00:00:00.000Z");
      }
      // All other fields in Project that are optional (String?, Relation?, etc...)
      else if (
        key === "logo" ||
        key === "background" ||
        key === "headline" ||
        key === "excerpt" ||
        key === "description" ||
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
          projectVisibility[key] === true ? project[key] : null;
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
