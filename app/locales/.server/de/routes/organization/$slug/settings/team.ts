export const locale = {
  error: {
    invariant: {
      notFound: "Organization not found",
      noStringIntent: "Bad request: intent is not a string",
      wrongIntent: "Bad request: wrong intent",
      entitiesForInviteNotFound: "Profile or organization for invite not found",
      entitiesForRemovalNotFound:
        "Profile or organization for removal not found",
      teamMemberCount:
        "Es muss immer ein Teammitglied geben. Bitte füge zuerst jemand anderen als Teammitglied hinzu.",
      alreadyMember: "Bereits Mitglied",
    },
  },
  email: {
    subject: "Du hast eine Einladung erhalten!",
    button: {
      text: "Zur Community Plattform",
    },
  },
  content: {
    profileInvited:
      "{{firstName}} {{lastName}} wurde eingeladen Teammitglied zu werden.",
    profileRemoved: "{{firstName}} {{lastName}} als Teammitglied entfernt.",
    inviteCancelled:
      "Die Einladung an {{firstName}} {{lastName}} wurde zurückgezogen.",
    headline: "Team",
    intro:
      "Wer ist Teil Eurer Organisation? Füge hier weitere Teammitglieder hinzu oder entferne sie. Teammitglieder werden auf der Organisations Detailseite gezeigt. Sie können Organisationen nicht bearbeiten.",
    current: {
      headline_one: "Aktuelles Teammitglied",
      headline_other: "Aktuelle Teammitglieder",
      remove: "Entfernen",
    },
    invite: {
      headline: "Teammitglied einladen",
      search: "Suche",
      criteria: "Mindestens 3 Buchstaben.",
      submitSearch: "Suchen",
      alreadyInvited: "Bereits eingeladen",
      alreadyMember: "Bereits Mitglied",
      submit: "Einladen",
    },
    invites: {
      headline: "Einladungen",
      intro: "Hier siehst Du alle Einladungen, die Du bereits versendet hast.",
      cancel: "Zurückziehen",
    },
  },
} as const;
