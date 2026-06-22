export const locale = {
  title: "Aktuelle Speaker:innen",
  list: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    searchPlaceholder: "Nach Speaker:innen suchen...",
    remove: "Entfernen",
  },
  errors: {
    removeSpeakerFailed: "Das Entfernen des Speakers ist fehlgeschlagen.",
  },
  success: {
    removeSpeaker: "Speaker:in wurde erfolgreich entfernt.",
  },
  mail: {
    subject: "Deine Rolle als Speaker:in beim Event {{eventName}}",
  },
} as const;
