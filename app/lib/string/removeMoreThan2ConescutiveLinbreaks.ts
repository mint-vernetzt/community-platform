export function removeMoreThan2ConescutiveLinbreaks(string: string) {
  return string.replace(/(\r\n|\n|\r){3,}/gm, "\n\n");
}
