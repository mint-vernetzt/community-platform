export const locale = {
  error: {
    invariant: {
      notFound: "Organization not found",
      noStringIntent: "Bad request: intent is not a string",
      wrongIntent: "Bad request: wrong intent",
      entitiesForInviteNotFound: "Profile or organization for invite not found",
      entitiesForRemovalNotFound:
        "Profile or organization for removal not found",
      adminCount:
        "Es muss immer eine:n Administrator:in geben. Bitte füge zuerst jemand anderen als Administrator:in hinzu.",
      alreadyAdmin: "Diese Person ist bereits Administrator:in.",
    },
  },
  email: {
    subject: "Du hast eine Einladung zum Admin erhalten!",
    button: {
      text: "Zur Community Plattform",
    },
  },
  content: {
    profileInvited:
      "{{firstName}} {{lastName}} wurde eingeladen Admin zu werden.",
    profileRemoved: "{{firstName}} {{lastName}} als Admin entfernt.",
    inviteCancelled:
      "Die Einladung an {{firstName}} {{lastName}} wurde zurückgezogen.",
    headline: "Admin-Rollen verwalten",
    intro:
      "Wer verwaltet diese Organisation auf der Community Plattform? Füge hier weitere Administrator:innen hinzu oder entferne sie. Administrator:innen können Organisationen anlegen, bearbeiten, löschen, sowie Team-Mitglieder hinzufügen. Sie sind nicht auf der Organisations-Detailseite sichtbar. Team-Mitglieder werden auf der Organisations-Detailseite gezeigt. Sie können Organisationen nicht bearbeiten.",
    current: {
      headline_one: "Administrator:in",
      headline_other: "Administrator:innen",
      remove: "Entfernen",
    },
    invite: {
      headline: "Administrator:in einladen",
      search: "Suche",
      criteria: "Mindestens 3 Buchstaben.",
      submitSearch: "Suchen",
      alreadyInvited: "bereits eingeladen",
      alreadyAdmin: "bereits Administrator:in",
      submit: "Einladen",
    },
    invites: {
      headline: "Einladungen",
      intro: "Hier siehst Du alle Einladungen, die Du bereits versendet hast.",
      cancel: "Zurückziehen",
    },
  },
} as const;
