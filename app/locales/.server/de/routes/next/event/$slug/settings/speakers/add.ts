export const locale = {
  search: {
    title: "Speaker:in hinzufügen",
    explanation:
      "Lade Speaker:innen zu Deinem Event ein. Aktuell kannst Du nur Speaker:innen einladen, die bereits ein Profil auf der Plattform haben. Die Personen müssen die Einladung annehmen, um als Speaker:in gelistet zu werden.",
    label: "Suche nach Personen",
    placeholder: "Name oder E-Mail-Adresse",
    hint: "Gib mindestens 3 Buchstaben ein.",
    submit: "Suchen",
    result_one: "Es wurde {{count}} Person gefunden.",
    result_other: "Es wurden {{count}} Personen gefunden.",
    invite: "Einladen",
    alreadySpeaker: "bereits Speaker:in",
    alreadyInvited: "bereits angefragt",
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    validation: {
      min: "Bitte gib mindestens 3 Zeichen ein, um zu suchen.",
    },
  },
  errors: {
    inviteProfileAsSpeaker:
      "Beim Einladen der Person als Speaker:in ist ein Fehler aufgetreten. Bitte versuche es erneut.",
  },
  success: {
    inviteProfileAsSpeaker: "Die Einladung wurde erfolgreich versendet.",
  },
  mail: {
    buttonText: "Zur Community Plattform",
    subject: "Einladung als Speaker:in im Event {{eventName}}",
  },
} as const;
