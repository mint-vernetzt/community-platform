export function escapeFilenameSpecialChars(filename: string) {
  const regex = /[^\t\x20-\x7e\x80-\xff]/g;
  const subst = "";
  const result = filename.replace(regex, subst);
  return result;
}
