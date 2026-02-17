export function hasContent(
  field: string | null | any[]
): field is string | any[] {
  if (field === null) {
    return false;
  }
  if (Array.isArray(field)) {
    return field.length > 0;
  }
  const trimmedField = field.trim();
  return trimmedField !== "" && trimmedField !== "<p></p>";
}
