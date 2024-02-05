import { type Profile } from "@prisma/client";

type GetFullNameOptions = {
  withAcademicTitle: boolean;
};

export function getFullName(
  data: Pick<Partial<Profile>, "firstName" | "lastName" | "academicTitle">,
  options: GetFullNameOptions = { withAcademicTitle: true }
) {
  const { firstName, lastName, academicTitle } = data;

  if (typeof academicTitle === "string" && options.withAcademicTitle === true) {
    return `${academicTitle} ${firstName} ${lastName}`;
  }

  return `${firstName} ${lastName}`;
}
