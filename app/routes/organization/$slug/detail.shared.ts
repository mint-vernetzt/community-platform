import { type Organization } from "@prisma/client";
import { hasContent } from "~/utils.shared";

export function hasAboutData(
  organization: Pick<
    Organization,
    | "bio"
    | "email"
    | "phone"
    | "website"
    | "city"
    | "street"
    | "zipCode"
    | "facebook"
    | "linkedin"
    | "twitter"
    | "xing"
    | "instagram"
    | "youtube"
    | "mastodon"
    | "tiktok"
    | "supportedBy"
  > & {
    areas: any[];
    focuses: any[];
  }
) {
  return (
    hasContent(organization.bio) ||
    hasContent(organization.email) ||
    hasContent(organization.phone) ||
    hasContent(organization.website) ||
    hasContent(organization.city) ||
    hasContent(organization.street) ||
    hasContent(organization.zipCode) ||
    hasContent(organization.facebook) ||
    hasContent(organization.linkedin) ||
    hasContent(organization.twitter) ||
    hasContent(organization.xing) ||
    hasContent(organization.instagram) ||
    hasContent(organization.youtube) ||
    hasContent(organization.mastodon) ||
    hasContent(organization.tiktok) ||
    hasContent(organization.areas) ||
    hasContent(organization.focuses) ||
    hasContent(organization.supportedBy)
  );
}

export function hasNetworkData(organization: {
  _count: {
    networkMembers: number;
    memberOf: number;
  };
}) {
  return (
    organization._count.networkMembers > 0 || organization._count.memberOf > 0
  );
}

export function hasTeamData(organization: {
  _count: {
    teamMembers: number;
  };
}) {
  return organization._count.teamMembers > 0;
}

export function hasEventsData(organization: {
  _count: {
    responsibleForEvents: number;
  };
}) {
  return organization._count.responsibleForEvents > 0;
}

export function hasProjectsData(organization: {
  _count: {
    responsibleForProject: number;
  };
}) {
  return organization._count.responsibleForProject > 0;
}
