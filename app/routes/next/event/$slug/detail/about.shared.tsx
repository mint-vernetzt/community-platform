import { z } from "zod";

export const SEARCH_SPEAKERS_SEARCH_PARAM = "search_speakers";

export function getSearchSpeakersSchema() {
  return z.object({
    [SEARCH_SPEAKERS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
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
  return (
    event.subline !== null &&
    event.subline.trim() !== "" &&
    event.subline.trim() !== "<p></p>"
  );
}

export function hasDescription(event: {
  description: string | null;
}): event is { description: string } {
  return (
    event.description !== null &&
    event.description.trim() !== "" &&
    event.description.trim() !== "<p></p>"
  );
}

export function hasGeneralInfo(event: {
  venueName: string | null;
  venueStreet: string | null;
  venueStreetNumber: string | null;
  venueZipCode: string | null;
  venueCity: string | null;
  eventTargetGroups: unknown[];
  focuses: unknown[];
  experienceLevel: {
    slug: string;
  } | null;
  tags: unknown[];
}) {
  return (
    hasAddress(event) ||
    hasEventTargetGroups(event) ||
    hasFocuses(event) ||
    hasExperienceLevel(event) ||
    hasTags(event)
  );
}

export function hasAddress(event: {
  venueName: string | null;
  venueStreet: string | null;
  venueStreetNumber: string | null;
  venueZipCode: string | null;
  venueCity: string | null;
}) {
  return (
    hasVenueName(event) ||
    hasVenueStreet(event) ||
    hasVenueStreetNumber(event) ||
    hasVenueZipCode(event) ||
    hasVenueCity(event)
  );
}

export function hasVenueStreet(event: {
  venueStreet: string | null;
}): event is { venueStreet: string } {
  return (
    event.venueStreet !== null &&
    event.venueStreet.trim() !== "" &&
    event.venueStreet.trim() !== "<p></p>"
  );
}

export function hasVenueStreetNumber(event: {
  venueStreetNumber: string | null;
}): event is { venueStreetNumber: string } {
  return (
    event.venueStreetNumber !== null &&
    event.venueStreetNumber.trim() !== "" &&
    event.venueStreetNumber.trim() !== "<p></p>"
  );
}

export function hasVenueZipCode(event: {
  venueZipCode: string | null;
}): event is { venueZipCode: string } {
  return (
    event.venueZipCode !== null &&
    event.venueZipCode.trim() !== "" &&
    event.venueZipCode.trim() !== "<p></p>"
  );
}

export function hasVenueCity(event: {
  venueCity: string | null;
}): event is { venueCity: string } {
  return (
    event.venueCity !== null &&
    event.venueCity.trim() !== "" &&
    event.venueCity.trim() !== "<p></p>"
  );
}

export function hasVenueName(event: {
  venueName: string | null;
}): event is { venueName: string } {
  return (
    event.venueName !== null &&
    event.venueName.trim() !== "" &&
    event.venueName.trim() !== "<p></p>"
  );
}

export function getFormattedAddress(event: {
  venueName: string | null;
  venueStreet: string | null;
  venueStreetNumber: string | null;
  venueZipCode: string | null;
  venueCity: string | null;
}) {
  const nameAndAddressLines = [];
  if (hasVenueName(event)) {
    nameAndAddressLines.push(event.venueName);
  }
  const streetLines = [];
  if (hasVenueStreetNumber(event) && hasVenueStreet(event)) {
    streetLines.push(event.venueStreet);
    streetLines.push(event.venueStreetNumber);
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

export function hasEventTargetGroups(event: { eventTargetGroups: unknown[] }) {
  return event.eventTargetGroups.length > 0;
}

export function hasFocuses(event: { focuses: unknown[] }) {
  return event.focuses.length > 0;
}

export function hasExperienceLevel(event: {
  experienceLevel: { slug: string } | null;
}): event is { experienceLevel: { slug: string } } {
  return event.experienceLevel !== null;
}

export function hasTags(event: { tags: unknown[] }) {
  return event.tags.length > 0;
}

export function hasSpeakers(event: { speakers: unknown[] }) {
  return event.speakers.length > 0;
}
