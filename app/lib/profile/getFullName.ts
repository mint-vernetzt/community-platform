import { Profile } from "@prisma/client";

export function getFullName(data: Partial<Profile>) {
  const { firstName, lastName, academicTitle } = data;
  let fullName = "";
  if (firstName !== undefined && lastName !== undefined) {
    if (typeof academicTitle === "string") {
      fullName = `${academicTitle} ${firstName} ${lastName}`;
    } else {
      fullName = `${firstName} ${lastName}`;
    }
  }
  return fullName;
}
