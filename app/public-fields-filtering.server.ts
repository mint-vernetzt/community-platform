import type { Profile } from "@prisma/client";
import { invariantResponse } from "./lib/utils/response";
import type { EntitySubset } from "./lib/utils/types";
import { prismaClient } from "./prisma.server";

type ProfileWithRelations = Profile & {
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
    console.error(`Profile visibilities for profile ${profile.id} not found.`);
    invariantResponse(false, "Profile visibilities not found.", {
      status: 404,
    });
  }

  for (const key in profile) {
    if (key in profileVisibility === false) {
      console.error(
        `profile.${key} is not present in the profile visibilities.`
      );
    }
  }
  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        key === "joinOrganizationRequests" ||
        key === "joinOrganizationInvites" ||
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
