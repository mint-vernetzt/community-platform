import type { Event, Organization, Profile, Project } from "@prisma/client";
import { notFound } from "remix-utils";
import type { EntitySubset } from "./types";
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
  _count: any;
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
        if (typeof organization[key] !== "undefined") {
          filteredFields[key] =
            organizationVisibility[key] === true ? organization[key] : "";
        } else {
          filteredFields[key] = undefined;
        }
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
        if (typeof organization[key] !== "undefined") {
          filteredFields[key] =
            organizationVisibility[key] === true ? organization[key] : [];
        } else {
          filteredFields[key] = undefined;
        }
      }
      // Fields in Organization with type DateTime
      else if (key === "createdAt" || key === "updatedAt") {
        if (typeof organization[key] !== "undefined") {
          filteredFields[key] =
            organizationVisibility[key] === true
              ? organization[key]
              : new Date("1970-01-01T00:00:00.000Z");
        } else {
          filteredFields[key] = undefined;
        }
      }
      // Fields in Organization with type Int
      else if (key === "score") {
        if (typeof organization[key] !== "undefined") {
          filteredFields[key] =
            organizationVisibility[key] === true ? organization[key] : 0;
        } else {
          filteredFields[key] = undefined;
        }
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
        if (typeof organization[key] !== "undefined") {
          filteredFields[key] =
            organizationVisibility[key] === true ? organization[key] : null;
        } else {
          filteredFields[key] = undefined;
        }
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
        if (typeof event[key] !== "undefined") {
          filteredFields[key] = eventVisibility[key] === true ? event[key] : "";
        } else {
          filteredFields[key] = undefined;
        }
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
        if (typeof event[key] !== "undefined") {
          filteredFields[key] = eventVisibility[key] === true ? event[key] : [];
        } else {
          filteredFields[key] = undefined;
        }
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
        if (typeof event[key] !== "undefined") {
          filteredFields[key] =
            eventVisibility[key] === true
              ? event[key]
              : new Date("1970-01-01T00:00:00.000Z");
        } else {
          filteredFields[key] = undefined;
        }
      }
      // Fields in Profile with type Boolean
      else if (key === "published" || key === "canceled") {
        if (typeof event[key] !== "undefined") {
          filteredFields[key] =
            eventVisibility[key] === true ? event[key] : true;
        } else {
          filteredFields[key] = undefined;
        }
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
        if (typeof event[key] !== "undefined") {
          filteredFields[key] =
            eventVisibility[key] === true ? event[key] : null;
        } else {
          filteredFields[key] = undefined;
        }
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
  responsibleOrganizations: any;
  targetGroups: any;
  teamMembers: any;
  projectVisibility: any;
  _count: any;
};

export async function filterListOfProjectsByVisibility<
  T extends EntitySubset<EventWithRelations, T>
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
        if (typeof project[key] !== "undefined") {
          filteredFields[key] =
            projectVisibility[key] === true ? project[key] : "";
        } else {
          filteredFields[key] = undefined;
        }
      }
      // Fields in Project with type []
      else if (
        key === "awards" ||
        key === "disciplines" ||
        key === "responsibleOrganizations" ||
        key === "targetGroups" ||
        key === "teamMembers"
      ) {
        if (typeof project[key] !== "undefined") {
          filteredFields[key] =
            projectVisibility[key] === true ? project[key] : [];
        } else {
          filteredFields[key] = undefined;
        }
      }
      // Fields in Project with type DateTime
      else if (key === "createdAt" || key === "updatedAt") {
        if (typeof project[key] !== "undefined") {
          filteredFields[key] =
            projectVisibility[key] === true
              ? project[key]
              : new Date("1970-01-01T00:00:00.000Z");
        } else {
          filteredFields[key] = undefined;
        }
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
        if (typeof project[key] !== "undefined") {
          filteredFields[key] =
            projectVisibility[key] === true ? project[key] : null;
        } else {
          filteredFields[key] = undefined;
        }
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
