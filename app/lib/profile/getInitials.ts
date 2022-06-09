import { Profile } from "@prisma/client";

export function getInitials(data: Pick<Profile, "firstName" | "lastName">) {
  let initials = "";
  const { firstName, lastName } = data;
  initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return initials;
}
