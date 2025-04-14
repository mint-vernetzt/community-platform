export const locale = {
  error: {
    invariant: {
      notFound: "Project not found",
      noStringIntent: "Bad request: intent is not a string",
      wrongIntent: "Bad request: wrong intent",
      entitiesForInviteNotFound: "Profile or project for invite not found",
      entitiesForRemovalNotFound: "Profile or project for removal not found",
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
    profileAdded: "{{firstName}} {{lastName}} als Admin hinzugefügt.",
    profileInvited:
      "{{firstName}} {{lastName}} wurde eingeladen Admin zu werden.",
    profileRemoved: "{{firstName}} {{lastName}} als Admin entfernt.",
    inviteCancelled:
      "Die Einladung an {{firstName}} {{lastName}} wurde zurückgezogen.",
    headline: "Admin-Rollen verwalten",
    intro:
      "Wer verwaltet dieses Projekt auf der Community Plattform? Füge hier weitere Administrator:innen hinzu oder entferne sie. Administrator:innen können Projekte anlegen, bearbeiten, löschen, sowie Team-Mitglieder hinzufügen. Sie sind nicht auf der Projekt-Detailseite sichtbar. Team-Mitglieder werden auf der Projekt-Detailseite gezeigt. Sie können Projekte nicht bearbeiten.",
    current: {
      headline_one: "Administrator:in",
      headline_other: "Administrator:innen",
      remove: "Entfernen",
    },
    add: {
      headline: "Administrator:in hinzufügen",
      search: "Suche",
      criteria: "Mindestens 3 Buchstaben.",
      submitSearch: "Suchen",
      alreadyAdmin: "bereits Administrator:in",
      submit: "Hinzufügen",
    },
    invite: {
      headline: "Administrator:in einladen",
      search: "Suche",
      criteria: "Mindestens 3 Buchstaben.",
      submitSearch: "Suchen",
      alreadyAdmin: "bereits Administrator:in",
      alreadyInvited: "bereits eingeladen",
      submit: "Einladen",
    },
    invites: {
      headline: "Einladungen",
      intro: "Hier siehst Du alle Einladungen, die Du bereits versendet hast.",
      cancel: "Zurückziehen",
    },
  },
} as const;
