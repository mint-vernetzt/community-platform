import { Profile } from "@prisma/client";

export function getFullName(
  data: Pick<Partial<Profile>, "firstName" | "lastName" | "academicTitle">
) {
  const { firstName, lastName, academicTitle } = data;

  if (typeof academicTitle === "string") {
    return `${academicTitle} ${firstName} ${lastName}`;
  }

  return `${firstName} ${lastName}`;
}
