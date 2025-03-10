export const locale = {
  error: {
    eventNotFound: "Event not found",
    profileNotFound: "Profile not found",
    notPrivileged: "Not privileged",
    input: "Der Name der Veranstaltung ist nicht korrekt",
    delete: "Die Veranstaltung konnte nicht gelöscht werden.",
  },
  content: {
    headline: "Veranstaltung löschen",
    intro:
      'Bitte gib den Namen der Veranstaltung "{{name}}" ein, um das Löschen zu bestätigen. Wenn Du danach auf "Veranstaltung löschen" klickst, wird Eure Veranstaltung ohne erneute Abfrage gelöscht.',
    list: "Folgende Veranstaltung und zugehörige Veranstaltung werden auch gelöscht:",
  },
  form: {
    eventName: {
      label: "Löschung bestätigen",
    },
    submit: {
      label: "Veranstaltung löschen",
    },
    publish: {
      label: "Veröffentlichen",
    },
    hide: {
      label: "Verstecken",
    },
  },
} as const;
