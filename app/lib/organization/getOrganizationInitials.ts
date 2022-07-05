export function getOrganizationInitials(organizationName: string) {
  let initials = "";
  const name = organizationName;
  const splittedName = name.split(" ", 2);
  initials = `${splittedName[0].charAt(0)}${
    splittedName[1]?.charAt(0) || ""
  }`.toUpperCase();
  return initials;
}
