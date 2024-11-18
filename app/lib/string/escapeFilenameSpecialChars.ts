// Should only use US-ASCII characters if used in Content-Disposition header.
// see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
// and RFC specs https://www.rfc-editor.org/rfc/rfc2183#section-2.3

export function escapeFilenameSpecialChars(filename: string) {
  const regex = /[^\x20-\x7e]/g; // Only US-ASCII characters
  const subst = "";
  // Mapping important characters of ASCII Extension ISO-8859-1 (Latin-1) encoding to US-ASCII
  // This is definitely not a complete mapping, but should cover some of the common cases
  // Feel free to extend or optimize
  const result = filename
    .replaceAll('"', "'")
    .replaceAll(/[%*/:<>?\\|]/g, "_")
    .replaceAll(/[ÀÁÂÃÅ]/g, "A")
    .replaceAll(/[ÄÆ]/g, "Ae")
    .replaceAll("Ç", "C")
    .replaceAll(/[ÈÉÊË]/g, "E")
    .replaceAll(/[ÌÍÎÏ]/g, "I")
    .replaceAll("Ð", "D")
    .replaceAll("Ñ", "N")
    .replaceAll(/[ÒÓÔÕ]/g, "O")
    .replaceAll(/[ÖØ]/g, "Oe")
    .replaceAll("×", "x")
    .replaceAll(/[ÙÚÛ]/g, "U")
    .replaceAll(/[Ü]/g, "Ue")
    .replaceAll("Ý", "Y")
    .replaceAll("Þ", "Th")
    .replaceAll("ß", "ss")
    .replaceAll(/[àáâãå]/g, "a")
    .replaceAll(/[äæ]/g, "ae")
    .replaceAll("ç", "c")
    .replaceAll(/[èéêë]/g, "e")
    .replaceAll(/[ìíîï]/g, "i")
    .replaceAll("ð", "d")
    .replaceAll("ñ", "n")
    .replaceAll(/[òóôõ]/g, "o")
    .replaceAll(/[öø]/g, "oe")
    .replaceAll(/[ùúû]/g, "u")
    .replaceAll(/[ü]/g, "ue")
    .replaceAll(/[ýÿ]/g, "y")
    .replaceAll("þ", "th")
    .replaceAll(regex, subst);
  return result;
}
