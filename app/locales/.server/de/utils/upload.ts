export const locale = {
  validation: {
    document: {
      size: "Die Datei darf nicht größer als {{size}}MB sein.",
      type: "Die Datei muss ein PDF sein.",
    },
    image: {
      size: "Die Datei darf nicht größer als {{size}}MB sein.",
      type: "Die Datei muss ein PNG oder ein JPEG sein.",
    },
  },
  selection: {
    select: "Datei auswählen",
    empty: "Du hast keine Datei ausgewählt.",
  },
  success: {
    imageAdded: "{{imageType}} hinzugefügt",
    imageRemoved: "{{imageType}} entfernt",
    imageTypes: {
      background: "Hintergrundbild",
      avatar: "Profilbild",
      logo: "Logo",
    },
  },
} as const;
