import { z } from "zod";
import { hasContent } from "~/utils.shared";

export const SEARCH_SPEAKERS_SEARCH_PARAM = "search_speakers";
export const SEARCH_TEAM_MEMBERS_SEARCH_PARAM = "search_team_members";
export const SEARCH_RESPONSIBLE_ORGANIZATIONS_SEARCH_PARAM =
  "search_responsible_organizations";

export function getSearchSpeakersSchema() {
  return z.object({
    [SEARCH_SPEAKERS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}

export function getSearchTeamMembersSchema() {
  return z.object({
    [SEARCH_TEAM_MEMBERS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}

export function getSearchResponsibleOrganizationsSchema() {
  return z.object({
    [SEARCH_RESPONSIBLE_ORGANIZATIONS_SEARCH_PARAM]: z
      .string()
      .trim()
      .min(3)
      .optional(),
  });
}

export function hasDescriptionSection(event: {
  subline: string | null;
  description: string | null;
  types: unknown[];
}) {
  return hasDescription(event) || hasSublineAndTypesSection(event);
}

export function hasSublineAndTypesSection(event: {
  subline: string | null;
  types: unknown[];
}) {
  return hasSubline(event) || hasTypes(event);
}

export function hasTypes(event: { types: unknown[] }) {
  return event.types.length > 0;
}

export function hasSubline(event: {
  subline: string | null;
}): event is { subline: string } {
  return hasContent(event.subline);
}

export function hasDescription(event: {
  description: string | null;
}): event is { description: string } {
  return hasContent(event.description);
}

export function hasConferenceLink(event: {
  conferenceLink: string | null;
}): event is { conferenceLink: string } {
  return hasContent(event.conferenceLink);
}

export function hasConferenceCode(event: {
  conferenceCode: string | null;
}): event is { conferenceCode: string } {
  return hasContent(event.conferenceCode);
}

export function hasGeneralInfo(event: {
  accessibilityInformation: string | null;
  privacyInformation: string | null;
  venueName: string | null;
  venueStreet: string | null;
  venueZipCode: string | null;
  venueCity: string | null;
  eventTargetGroups: unknown[];
  focuses: unknown[];
  conferenceLink: string | null;
  conferenceCode: string | null;
  conferenceLinkToBeAnnounced: boolean;
  experienceLevel: {
    slug: string;
  } | null;
  tags: unknown[];
}) {
  return (
    hasAccessibilityInformation(event) ||
    hasPrivacyInformation(event) ||
    hasAddress(event) ||
    hasEventTargetGroups(event) ||
    hasFocuses(event) ||
    hasExperienceLevel(event) ||
    hasTags(event) ||
    hasConferenceLink(event) ||
    event.conferenceLinkToBeAnnounced === true
  );
}

export function hasAddress(event: {
  venueName: string | null;
  venueStreet: string | null;
  venueZipCode: string | null;
  venueCity: string | null;
}) {
  return (
    hasVenueName(event) ||
    hasVenueStreet(event) ||
    hasVenueZipCode(event) ||
    hasVenueCity(event)
  );
}

export function hasVenueStreet(event: {
  venueStreet: string | null;
}): event is { venueStreet: string } {
  return hasContent(event.venueStreet);
}

export function hasVenueZipCode(event: {
  venueZipCode: string | null;
}): event is { venueZipCode: string } {
  return hasContent(event.venueZipCode);
}

export function hasVenueCity(event: {
  venueCity: string | null;
}): event is { venueCity: string } {
  return hasContent(event.venueCity);
}

export function hasVenueName(event: {
  venueName: string | null;
}): event is { venueName: string } {
  return hasContent(event.venueName);
}

export function getFormattedAddress(event: {
  venueName: string | null;
  venueStreet: string | null;
  venueZipCode: string | null;
  venueCity: string | null;
}) {
  const nameAndAddressLines = [];
  if (hasVenueName(event)) {
    nameAndAddressLines.push(event.venueName);
  }
  const streetLines = [];
  if (hasVenueStreet(event)) {
    streetLines.push(event.venueStreet);
  }
  const cityLines = [];
  if (hasVenueZipCode(event) && hasVenueCity(event)) {
    cityLines.push(event.venueZipCode);
    cityLines.push(event.venueCity);
  }
  const addressLine = [];
  if (streetLines.length > 0) {
    addressLine.push(streetLines.join(" "));
  }
  if (cityLines.length > 0) {
    addressLine.push(cityLines.join(" "));
  }
  if (addressLine.length > 0) {
    nameAndAddressLines.push(addressLine.join(", "));
  }
  return nameAndAddressLines.join(" / ");
}

export function hasAccessibilityInformation(event: {
  accessibilityInformation: string | null;
}): event is { accessibilityInformation: string } {
  return hasContent(event.accessibilityInformation);
}

export function hasPrivacyInformation(event: {
  privacyInformation: string | null;
}): event is { privacyInformation: string } {
  return hasContent(event.privacyInformation);
}

export function hasEventTargetGroups(event: { eventTargetGroups: unknown[] }) {
  return hasContent(event.eventTargetGroups);
}

export function hasFocuses(event: { focuses: unknown[] }) {
  return hasContent(event.focuses);
}

export function hasExperienceLevel(event: {
  experienceLevel: { slug: string } | null;
}): event is { experienceLevel: { slug: string } } {
  return hasContent(event.experienceLevel);
}

export function hasTags(event: { tags: unknown[] }) {
  return hasContent(event.tags);
}

export function hasDocuments(event: { documents: unknown[] }) {
  return hasContent(event.documents);
}

export function hasSpeakers(event: { speakers: unknown[] }) {
  return hasContent(event.speakers);
}

export function hasResponsibleOrganizations(event: {
  responsibleOrganizations: unknown[];
}) {
  return hasContent(event.responsibleOrganizations);
}
