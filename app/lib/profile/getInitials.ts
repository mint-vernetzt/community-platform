import { Profile } from "@prisma/client";

export function getInitials(data: Partial<Profile>) {
  let initials = "";
  if (data.firstName !== undefined && data.lastName !== undefined) {
    const { firstName, lastName } = data;
    initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  return initials;
}
