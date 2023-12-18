import { TFunction } from "i18next";

export function getFullName(
  data: { academicTitle?: string | null; firstName: string; lastName: string },
  options: { withAcademicTitle: boolean } = { withAcademicTitle: true }
) {
  const { firstName, lastName, academicTitle } = data;

  if (typeof academicTitle === "string" && options.withAcademicTitle === true) {
    return `${academicTitle} ${firstName} ${lastName}`;
  }

  return `${firstName} ${lastName}`;
}

export function getInitials(
  options: { firstName: string; lastName: string } | { name: string }
) {
  if ("name" in options) {
    const splittedName = options.name.split(" ", 2);
    const initials = `${splittedName[0].charAt(0)}${
      splittedName[1]?.charAt(0) || ""
    }`.toUpperCase();
    return initials;
  }

  const { firstName, lastName } = options;
  return firstName && lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : "";
}
