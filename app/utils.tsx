export function generateUsername(firstName: string, lastName: string) {
  return generateValidSlug(`${firstName}${lastName}`);
}

export function generateOrganizationSlug(name: string) {
  return generateValidSlug(name);
}

export function generateEventSlug(name: string, timestamp: number) {
  const nameSlug = generateValidSlug(name);
  const stringFromTimestamp = timestamp.toString(36);
  return `${nameSlug}-${stringFromTimestamp}`;
}

export function generateProjectSlug(name: string) {
  const nameSlug = generateValidSlug(name);
  const timestamp = Date.now();
  const stringFromTimestamp = timestamp.toString(36);
  return `${nameSlug}-${stringFromTimestamp}`;
}

// TODO: Use libraray (Don't know the name anymore) to convert all Unicode in a valid slug
// (Greek letters, chinese letters, arabic letters, etc...)
function generateValidSlug(string: string) {
  return string
    .toLowerCase()
    .replace(/[áàâãå]/, "a")
    .replace(/[äæ]/, "ae")
    .replace(/[ç]/, "c")
    .replace(/[éèêë]/, "e")
    .replace(/[íìîï]/, "i")
    .replace(/[ñ]/, "n")
    .replace(/[ß]/, "ss")
    .replace(/[óòôõ]/, "o")
    .replace(/[öœø]/, "oe")
    .replace(/[úùû]/, "u")
    .replace(/[ü]/, "ue")
    .replace(/[^\w ]/g, "")
    .replace(/[\s]/g, "");
}
