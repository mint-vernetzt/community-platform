export const locale = {
  error: {
    invariant: {
      notFound: "Project not found",
      noStringIntent: "Bad request: intent is not a string",
      wrongIntent: "Bad request: wrong intent",
      entitiesForInviteNotFound: "Organization or project for invite not found",
      entitiesForRemovalNotFound:
        "Organization or project for removal not found",
    },
  },
  email: {
    subject: "Du hast eine Einladung erhalten!",
    button: {
      text: "Zur Community Plattform",
    },
  },
  content: {
    organizationAdded: "{{name}} als verantwortliche Organisation hinzugefügt.",
    organizationInvited:
      "{{name}} wurde eingeladen eine verwantwortliche Organisation zu werden.",
    organizationRemoved: "{{name}} als verantwortliche Organisation entfernt.",
    inviteCancelled: "Die Einladung an {{name}} wurde zurückgezogen.",
    headline: "Verantwortliche Organisationen",
    intro:
      "Welche Organisationen stecken hinter dem Projekt? Verwalte hier die verantwortlichen Organisationen.",
    current: {
      headline_one: "Aktuell hinzugefügte Organisation",
      headline_other: "Aktuell hinzugefügte Organisationen",
      remove: "Entfernen",
    },
    addOwn: {
      headline_one: "Eigene Organisation hinzufügen",
      headline_other: "Eigene Organisationen hinzufügen",
      search: "Suche",
      criteria: "Mindestens 3 Buchstaben.",
      submitSearch: "Suchen",
      submit: "Hinzufügen",
    },
    addOther: {
      headline: "Andere Organisationen hinzufügen",
      search: {
        label: "Suche",
        helper: "Mindestens 3 Buchstaben.",
      },
      add: "Hinzufügen",
    },
    invite: {
      headline: "Organisation einladen",
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
