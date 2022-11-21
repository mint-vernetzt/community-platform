export function escapeFilenameSpecialChars(filename: string) {
  const regex = /[^\x20\x2e0-9A-Za-z]/g;
  const subst = "";
  const result = filename.replace(regex, subst);
  return result;
}
