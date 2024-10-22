import { type Organization } from "@prisma/client";

export function hasAboutData(
  organization: Pick<
    Organization,
    | "bio"
    | "email"
    | "phone"
    | "website"
    | "city"
    | "street"
    | "streetNumber"
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
    (organization.bio !== null &&
      organization.bio.trim() !== "" &&
      organization.bio.trim() !== "<p></p>") ||
    (organization.email !== null &&
      organization.email.trim() !== "" &&
      organization.email.trim() !== "<p></p>") ||
    (organization.phone !== null &&
      organization.phone.trim() !== "" &&
      organization.phone.trim() !== "<p></p>") ||
    (organization.website !== null &&
      organization.website.trim() !== "" &&
      organization.website.trim() !== "<p></p>") ||
    (organization.city !== null &&
      organization.city.trim() !== "" &&
      organization.city.trim() !== "<p></p>") ||
    (organization.street !== null &&
      organization.street.trim() !== "" &&
      organization.street.trim() !== "<p></p>") ||
    (organization.streetNumber !== null &&
      organization.streetNumber.trim() !== "" &&
      organization.streetNumber.trim() !== "<p></p>") ||
    (organization.zipCode !== null &&
      organization.zipCode.trim() !== "" &&
      organization.zipCode.trim() !== "<p></p>") ||
    (organization.facebook !== null &&
      organization.facebook.trim() !== "" &&
      organization.facebook.trim() !== "<p></p>") ||
    (organization.linkedin !== null &&
      organization.linkedin.trim() !== "" &&
      organization.linkedin.trim() !== "<p></p>") ||
    (organization.twitter !== null &&
      organization.twitter.trim() !== "" &&
      organization.twitter.trim() !== "<p></p>") ||
    (organization.xing !== null &&
      organization.xing.trim() !== "" &&
      organization.xing.trim() !== "<p></p>") ||
    (organization.instagram !== null &&
      organization.instagram.trim() !== "" &&
      organization.instagram.trim() !== "<p></p>") ||
    (organization.youtube !== null &&
      organization.youtube.trim() !== "" &&
      organization.youtube.trim() !== "<p></p>") ||
    (organization.mastodon !== null &&
      organization.mastodon.trim() !== "" &&
      organization.mastodon.trim() !== "<p></p>") ||
    (organization.tiktok !== null &&
      organization.tiktok.trim() !== "" &&
      organization.tiktok.trim() !== "<p></p>") ||
    organization.areas.length > 0 ||
    organization.focuses.length > 0 ||
    organization.supportedBy.length > 0
  );
}

export function hasNetworkData(organization: {
  networkMembers: any[];
  memberOf: any[];
}) {
  return (
    organization.networkMembers.length > 0 || organization.memberOf.length > 0
  );
}

export function hasTeamData(organization: { teamMembers: any[] }) {
  return organization.teamMembers.length > 0;
}

export function hasEventsData(organization: { responsibleForEvents: any[] }) {
  return organization.responsibleForEvents.length > 0;
}

export function hasProjectsData(organization: {
  responsibleForProject: any[];
}) {
  return organization.responsibleForProject.length > 0;
}
