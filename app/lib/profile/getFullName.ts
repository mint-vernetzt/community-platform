import { Profile } from "@prisma/client";

export function getFullName(
  data: Pick<Profile, "firstName" | "lastName" | "academicTitle">
) {
  const { firstName, lastName, academicTitle } = data;
  let fullName = "";
  if (typeof academicTitle === "string") {
    fullName = `${academicTitle} ${firstName} ${lastName}`;
  } else {
    fullName = `${firstName} ${lastName}`;
  }
  return fullName;
}
