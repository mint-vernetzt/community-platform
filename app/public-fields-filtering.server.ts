import type { Event, Organization, Profile, Project } from "@prisma/client";
import { notFound } from "remix-utils";
import { prismaClient } from "./prisma";

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
};

export async function filterProfileDataByVisibilitySettings<
  T extends Partial<ProfileWithRelations>
>(profiles: T[]) {
  const filteredProfiles: T[] = [];

  for (const profile of profiles) {
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
        throw new Error(
          `profile.${key} is not present in the profile visibilties.`
        );
      }
    }
    const filteredFields: { [key: string]: any } = {};
    for (const key in profileVisibility) {
      if (key !== "id" && key !== "profileId" && profile.hasOwnProperty(key)) {
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
              : "1970-01-01T00:00:00Z";
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
        // All other fields in Profile that are optional (String?)
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
          key === "youtube"
        ) {
          filteredFields[key] =
            profileVisibility[key] === true ? profile[key] : null;
        } else {
          throw new Error(
            `The ProfileVisibility key ${key} was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method.`
          );
        }
      }
    }
    filteredProfiles.push({ ...profile, ...filteredFields });
  }

  return filteredProfiles;
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
};

export async function filterOrganizationDataByVisibilitySettings<
  T extends Partial<OrganizationWithRelations>
>(organizations: T[]) {
  const filteredOrganizations: T[] = [];

  for (const organization of organizations) {
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
        throw new Error(
          `organization.${key} is not present in the organization visibilties.`
        );
      }
    }
    const filteredFields: { [key: string]: any } = {};
    for (const key in organizationVisibility) {
      if (
        key !== "id" &&
        key !== "organizationId" &&
        organization.hasOwnProperty(key)
      ) {
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
              : "1970-01-01T00:00:00Z";
        }
        // Fields in Organization with type Int
        else if (key === "score") {
          filteredFields[key] =
            organizationVisibility[key] === true ? organization[key] : 0;
        }
        // All other fields in Organization that are optional (String?)
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
          key === "youtube"
        ) {
          filteredFields[key] =
            organizationVisibility[key] === true ? organization[key] : null;
        } else {
          throw new Error(
            `The OrganizationVisibility key ${key} was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method.`
          );
        }
      }
    }
    filteredOrganizations.push({ ...organization, ...filteredFields });
  }

  return filteredOrganizations;
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
};

export async function filterEventDataByVisibilitySettings<
  T extends Partial<EventWithRelations>
>(events: T[]) {
  const filteredEvents: T[] = [];
  for (const event of events) {
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
      if (!eventVisibility.hasOwnProperty(key)) {
        throw new Error(
          `event.${key} is not present in the event visibilties.`
        );
      }
    }

    const filteredFields: { [key: string]: any } = {};
    for (const key in eventVisibility) {
      if (key !== "id" && key !== "eventId" && event.hasOwnProperty(key)) {
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
            eventVisibility[key] === true ? event[key] : "1970-01-01T00:00:00Z";
        }
        // Fields in Profile with type Boolean
        else if (key === "published" || key === "canceled") {
          filteredFields[key] =
            eventVisibility[key] === true ? event[key] : true;
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
          key === "stageId"
        ) {
          filteredFields[key] =
            eventVisibility[key] === true ? event[key] : null;
        } else {
          console.warn(
            `The EventVisibility key ${key} was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method.`
          );
        }
      }
    }
    filteredEvents.push({ ...event, ...filteredFields });
  }

  return filteredEvents;
}

type ProjectWithRelations = Project & {
  awards: any;
  disciplines: any;
  responsibleOrganizations: any;
  targetGroups: any;
  teamMembers: any;
  projectVisibility: any;
};

export async function filterProjectDataByVisibilitySettings<
  T extends Partial<ProjectWithRelations>
>(projects: T[]) {
  const filteredProjects: T[] = [];

  for (const project of projects) {
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
        throw new Error(
          `project.${key} is not present in the project visibilties.`
        );
      }
    }
    const filteredFields: { [key: string]: any } = {};
    for (const key in projectVisibility) {
      if (key !== "id" && key !== "projectId" && project.hasOwnProperty(key)) {
        // Fields in Project with type String
        if (key === "name" || key === "slug") {
          filteredFields[key] =
            projectVisibility[key] === true ? project[key] : "";
        }
        // Fields in Project with type []
        else if (
          key === "awards" ||
          key === "disciplines" ||
          key === "responsibleOrganizations" ||
          key === "targetGroups" ||
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
              : "1970-01-01T00:00:00Z";
        }
        // All other fields in Project that are optional (String?)
        else if (
          key === "logo" ||
          key === "background" ||
          key === "headline" ||
          key === "excerpt" ||
          key === "description" ||
          key === "email" ||
          key === "phone" ||
          key === "website" ||
          key === "street" ||
          key === "streetNumber" ||
          key === "zipCode" ||
          key === "facebook" ||
          key === "linkedin" ||
          key === "twitter" ||
          key === "youtube" ||
          key === "instagram" ||
          key === "xing" ||
          key === "city"
        ) {
          filteredFields[key] =
            projectVisibility[key] === true ? project[key] : null;
        } else {
          throw new Error(
            `The ProjectVisibility key ${key} was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method.`
          );
        }
      }
    }
    filteredProjects.push({ ...project, ...filteredFields });
  }

  return filteredProjects;
}
