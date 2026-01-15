export const locale = {
  title: "Ausstehende Einladungen",
  explanation: "Folgende Personen müssen noch auf Deine Einladung reagieren.",
  list: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    revoke: "Einladung zurückziehen",
  },
  search: {
    label: "Durchsuche die Einladungen",
    placeholder: "Name",
    hint: "Gib mindestens 3 Buchstaben ein.",
    validation: {
      min: "Bitte gib mindestens 3 Zeichen ein, um zu suchen.",
    },
  },
  errors: {
    revokeInviteFailed: "Das Zurückziehen der Einladung ist fehlgeschlagen.",
  },
  success: {
    revokeInvite: "Die Einladung wurde erfolgreich zurückgezogen.",
  },
} as const;
