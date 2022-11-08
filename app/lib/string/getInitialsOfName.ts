export function getInitialsOfName(name: string) {
  let initials = "";
  const originalName = name;
  const splittedName = originalName.split(" ", 2);
  initials = `${splittedName[0].charAt(0)}${
    splittedName[1]?.charAt(0) || ""
  }`.toUpperCase();
  return initials;
}
