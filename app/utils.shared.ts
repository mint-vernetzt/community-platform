export function hasContent(
  field: string | null | any[] | object | number | undefined
): field is string | any[] | object | number {
  if (field === null || field === undefined) {
    return false;
  }
  if (Array.isArray(field)) {
    return field.length > 0;
  }
  if (typeof field === "object") {
    return Object.keys(field).length > 0;
  }
  if (typeof field === "number") {
    return true;
  }
  const trimmedField = field.trim();
  return trimmedField !== "" && trimmedField !== "<p></p>";
}

export function getVenueString(options: {
  venueName: string | null;
  venueStreet: string | null;
  venueZipCode: string | null;
  venueCity: string | null;
}): string | undefined {
  const { venueName, venueStreet, venueZipCode, venueCity } = options;
  if (
    hasContent(venueName) === false &&
    hasContent(venueStreet) === false &&
    hasContent(venueZipCode) === false &&
    hasContent(venueCity) === false
  ) {
    return;
  }
  const parts = [];
  if (hasContent(venueName)) {
    parts.push(venueName);
  }
  if (hasContent(venueStreet)) {
    parts.push(venueStreet);
  }
  if (hasContent(venueCity)) {
    if (hasContent(venueZipCode)) {
      parts.push(`${venueZipCode} ${venueCity}`);
    } else {
      parts.push(venueCity);
    }
  }
  return parts.join(", ");
}
