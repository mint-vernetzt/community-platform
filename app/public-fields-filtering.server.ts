import type {
  AreaOfEvent,
  AreasOnOrganizations,
  AreasOnProfiles,
  AwardOfProject,
  DisciplineOfProject,
  DocumentOfEvent,
  Event,
  ExperienceLevel,
  FocusesOnOrganizations,
  FocusOfEvent,
  MemberOfNetwork,
  MemberOfOrganization,
  OffersOnProfiles,
  Organization,
  OrganizationTypesOnOrganizations,
  ParticipantOfEvent,
  Profile,
  Project,
  ResponsibleOrganizationOfEvent,
  ResponsibleOrganizationOfProject,
  SeekingsOnProfiles,
  SpeakerOfEvent,
  Stage,
  TagOfEvent,
  TargetGroupOfEvent,
  TargetGroupOfProject,
  TeamMemberOfEvent,
  TeamMemberOfProject,
  TypeOfEvent,
  WaitingParticipantOfEvent,
} from "@prisma/client";
import { prismaClient } from "./prisma";

type ProfileWithRelations = Profile & {
  areas: AreasOnProfiles[];
  memberOf: MemberOfOrganization[];
  offers: OffersOnProfiles[];
  participatedEvents: ParticipantOfEvent[];
  seekings: SeekingsOnProfiles[];
  contributedEvents: SpeakerOfEvent[];
  teamMemberOfEvents: TeamMemberOfEvent[];
  teamMemberOfProjects: TeamMemberOfProject[];
  waitingForEvents: WaitingParticipantOfEvent[];
};

export async function filterProfileDataByVisibilitySettings<
  T extends Partial<ProfileWithRelations>
>(profiles: T[]) {
  const filteredProfiles: T[] = [];

  for (const profile of profiles) {
    const profileVisibility = await prismaClient.profileVisibility.findFirst({
      where: {
        profileId: profile.id,
      },
    });

    if (profileVisibility === null) {
      continue;
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
  areas: AreasOnOrganizations[];
  focuses: FocusesOnOrganizations[];
  networkMembers: MemberOfNetwork[];
  memberOf: MemberOfNetwork[];
  teamMembers: MemberOfOrganization[];
  types: OrganizationTypesOnOrganizations[];
  responsibleForEvents: ResponsibleOrganizationOfEvent[];
  responsibleForProject: ResponsibleOrganizationOfProject[];
};

export async function filterOrganizationDataByVisibilitySettings<
  T extends Partial<OrganizationWithRelations>
>(organizations: T[]) {
  const filteredOrganizations: T[] = [];

  for (const organization of organizations) {
    const organizationVisibility =
      await prismaClient.organizationVisibility.findFirst({
        where: {
          organizationId: organization.id,
        },
      });

    if (organizationVisibility === null) {
      continue;
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
  areas: AreaOfEvent[];
  documents: DocumentOfEvent[];
  types: TypeOfEvent[];
  experienceLevel: ExperienceLevel | null;
  parentEvent: Event | null;
  childEvents: Event[];
  stage: Stage | null;
  focuses: FocusOfEvent[];
  participants: ParticipantOfEvent[];
  responsibleOrganizations: ResponsibleOrganizationOfEvent[];
  speakers: SpeakerOfEvent[];
  tags: TagOfEvent[];
  targetGroups: TargetGroupOfEvent[];
  teamMembers: TeamMemberOfEvent[];
  waitingList: WaitingParticipantOfEvent[];
};

export async function filterEventDataByVisibilitySettings<
  T extends Partial<EventWithRelations>
>(events: T[]) {
  const filteredEvents: T[] = [];

  for (const event of events) {
    const eventVisibility = await prismaClient.eventVisibility.findFirst({
      where: {
        eventId: event.id,
      },
    });

    if (eventVisibility === null) {
      continue;
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
          key === "parentEvent" ||
          key === "stage"
        ) {
          filteredFields[key] =
            eventVisibility[key] === true ? event[key] : null;
        } else {
          throw new Error(
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
  awards: AwardOfProject[];
  disciplines: DisciplineOfProject[];
  responsibleOrganizations: ResponsibleOrganizationOfProject[];
  targetGroups: TargetGroupOfProject[];
  teamMembers: TeamMemberOfProject[];
};

export async function filterProjectDataByVisibilitySettings<
  T extends Partial<ProjectWithRelations>
>(projects: T[]) {
  const filteredProjects: T[] = [];

  for (const project of projects) {
    const projectVisibility = await prismaClient.projectVisibility.findFirst({
      where: {
        projectId: project.id,
      },
    });

    if (projectVisibility === null) {
      continue;
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
