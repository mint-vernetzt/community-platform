export const locale = {
  title: "Ausstehende Einladungen",
  subline: "Folgende Personen müssen noch auf Deine Einladung reagieren.",
  search: {
    label: "Durchsuche die Einladungen",
    placeholder: "Name",
    hint: "Gib mindestens 3 Buchstaben ein.",
    validation: {
      min: "Bitte gib mindestens 3 Zeichen ein, um zu suchen.",
    },
  },
  list: {
    item: {
      invitedAt: "Eingeladen am {{date}}",
      revoke: "Einladung zurückziehen",
    },
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
  },
  mail: {
    revokeInviteToParticipateOnEvent: {
      subject: "Die Einladung zur Teilnahme am Event wurde zurückgezogen",
    },
  },
  errors: {
    revokeInviteToParticipateOnEvent:
      "Das Zurückziehen der Einladung zur Teilnahme am Event ist fehlgeschlagen.",
  },
  success: {
    revokeInviteToParticipateOnEvent:
      "Die Einladung zur Teilnahme am Event wurde erfolgreich zurückgezogen.",
  },
} as const;
