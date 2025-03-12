export const locale = {
  error: {
    invariant: {
      notFound: "Project not found",
      noStringIntent: "Bad request: intent is not a string",
      wrongIntent: "Bad request: wrong intent",
      entitiesForInviteNotFound: "Profile or project for invite not found",
      entitiesForRemovalNotFound: "Profile or project for removal not found",
      teamMemberCount:
        "Es muss immer ein Teammitglied geben. Bitte füge zuerst jemand anderen als Teammitglied hinzu.",
    },
  },
  email: {
    subject: "Du hast eine Einladung erhalten!",
    button: {
      text: "Zur Community Plattform",
    },
  },
  content: {
    profileAdded: "{{firstName}} {{lastName}} als Teammitglied hinzugefügt.",
    profileInvited:
      "{{firstName}} {{lastName}} wurde eingeladen Teammitglied zu werden.",
    profileRemoved: "{{firstName}} {{lastName}} als Teammitglied entfernt.",
    inviteCancelled:
      "Die Einladung an {{firstName}} {{lastName}} wurde zurückgezogen.",
    headline: "Team",
    intro:
      "Wer ist Teil Eures Projekts? Füge hier weitere Teammitglieder hinzu oder entferne sie. Teammitglieder werden auf der Projekt Detailseite gezeigt. Sie können Organisationen nicht bearbeiten.",
    current: {
      headline_one: "Aktuelles Teammitglied",
      headline_other: "Aktuelle Teammitglieder",
      remove: "Entfernen",
    },
    add: {
      headline: "Teammitglied hinzufügen",
      search: "Suche",
      criteria: "Mindestens 3 Buchstaben.",
      submitSearch: "Suchen",
      submit: "Hinzufügen",
    },
    invite: {
      headline: "Teammitglied einladen",
      search: "Suche",
      criteria: "Mindestens 3 Buchstaben.",
      submitSearch: "Suchen",
      submit: "Einladen",
    },
    invites: {
      headline: "Einladungen",
      intro: "Hier siehst Du alle Einladungen, die Du bereits versendet hast.",
      cancel: "Zurückziehen",
    },
  },
} as const;
