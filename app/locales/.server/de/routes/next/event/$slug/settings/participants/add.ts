export const locale = {
  title: "Teilnehmende einladen",
  subline:
    "Lade Teilnehmer:innen für Deine Veranstaltung ein. Die Einladungen müssen von den Personen angenommen werden.",
  parentParticipationRequiredHint:
    "Deine Einstellung erlaubt aktuell nur die Teilnahme zu deinem Unterevent, wenn auch am Rahmenevent teilgenommen wird. Da Du nicht Administrator:in der Rahmenveranstaltung bist, kannst du keine Teilnehmer:innen einladen.",
  search: {
    label: "Suche Personen",
    placeholder: "Name oder E-Mail-Adresse",
    helperText: "Gib mindestens 3 Buchstaben ein.",
    validation: {
      min: "Bitte gib mindestens 3 Zeichen ein, um zu suchen.",
    },
    submit: "Suchen",
    result_one: "Es wurde {{count}} Person gefunden.",
    result_other: "Es wurden {{count}} Personen gefunden.",
  },
  list: {
    item: {
      alreadyInvited: "bereits eingeladen",
      alreadyParticipant: "nimmt bereits teil",
      invite: "Einladen",
      inviteCreatedAt: "Eingeladen am {{date}}",
    },
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
  },
  errors: {
    inviteProfileToParticipate:
      "Die Einladung konnte nicht gesendet werden. Bitte versuche es später erneut.",
  },
  success: {
    inviteProfileToParticipate: "Die Einladung wurde erfolgreich gesendet.",
  },
  mail: {
    subject: "Einladung zur Teilnahme am Event {{eventName}}",
    buttonText: "Zur Community Plattform",
  },
} as const;
