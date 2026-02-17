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
