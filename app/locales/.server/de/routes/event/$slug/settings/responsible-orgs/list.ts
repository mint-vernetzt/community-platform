export const locale = {
  title: "Aktuelle Organisationen",
  list: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    searchPlaceholder: "Nach Organisationen suchen...",
    remove: "Entfernen",
  },
  errors: {
    removeResponsibleOrgFailed:
      "Das Entfernen der Organisation ist fehlgeschlagen.",
  },
  success: {
    removeResponsibleOrg: "Organisation wurde erfolgreich entfernt.",
  },
  mail: {
    subject: "Deine Rolle als Organisation beim Event {{eventName}}",
  },
} as const;
