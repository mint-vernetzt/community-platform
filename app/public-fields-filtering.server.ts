import type { Organization, Profile } from "@prisma/client";
import { json } from "@remix-run/server-runtime";
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
  _count: any;
};

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
    throw json({ message: "Profile visibilities not found." }, { status: 404 });
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
        key === "profileAbuseReport" ||
        key === "organizationAbuseReport" ||
        key === "eventAbuseReport" ||
        key === "projectAbuseReport" ||
        key === "abuseReports" ||
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
        key === "notificationSettings" ||
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
  abuseReports: any;
};

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
    throw json(
      { message: "Organization visibilities not found." },
      { status: 404 }
    );
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
        key === "abuseReports" ||
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
