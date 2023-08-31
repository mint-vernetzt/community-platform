import { type Profile } from "@prisma/client";

export function getInitials(
  profile: Pick<Partial<Profile>, "firstName" | "lastName">
) {
  const { firstName, lastName } = profile;

  return firstName && lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : "";
}
