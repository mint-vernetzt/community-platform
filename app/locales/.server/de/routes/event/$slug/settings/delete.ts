export const locale = {
  error: {
    eventNotFound: "Event not found",
    profileNotFound: "Profile not found",
    notPrivileged: "Not privileged",
    input: "Der Name des Events ist nicht korrekt",
    delete: "Das Event konnte nicht gelöscht werden.",
  },
  content: {
    headline: "Event löschen",
    intro:
      'Bitte gib den Namen des Events "{{name}}" ein, um das Löschen zu bestätigen. Wenn Du danach auf "Event löschen" klickst, wird Euer Event ohne erneute Abfrage gelöscht.',
    list: "Folgende Events und zugehörige Events werden auch gelöscht:",
  },
  form: {
    eventName: {
      label: "Löschung bestätigen",
    },
    submit: {
      label: "Event löschen",
    },
    publish: {
      label: "Veröffentlichen",
    },
    hide: {
      label: "Verstecken",
    },
  },
} as const;
