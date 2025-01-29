export const locale = {
  error: {
    notFound: "Organisation nicht gefunden",
    invalidRoute: "Ungültige Route",
    noStringIntent: "Bad request: intent is not a string",
    wrongIntent: "Bad request: wrong intent",
    updateFailed:
      "Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support",
  },
  content: {
    notFound: "Nicht gefunden",
    headline: "Organisation verwalten",
    success: "Daten gespeichert!",
    types: {
      headline: "Organisationsform",
      label: "Wähle die Art Deiner Organisation",
      helper: "Mehrfachauswahl möglich",
      option: "Bitte auswählen",
    },
    networkTypes: {
      headline: "Netzwerkform",
      label: "Wähle die Art Deines Netzwerkes aus",
      helper: "Mehrfachauswahl möglich",
      option: "Bitte auswählen",
    },
    networks: {
      current: {
        headline_one: "Aktuelles Netzwerk",
        headline_other: "Aktuelle Netzwerke",
        leave: "Austreten",
      },
      join: {
        headline: "Ist Deine Organisation Teil von anderen Netzwerken?",
        subline:
          "Suche die Netzwerk-Organisationen und füge Deine Organisation als Netzwerk-Mitglied hinzu.",
        label: "Name der Netzwerk-Organisation",
        placeholder: "Suche...",
        helper: "Mindestens 3 Buchstaben.",
        searchCta: "Suchen",
        cta: "Beitreten",
      },
    },
  },
  form: {
    reset: "Änderungen verwerfen",
    submit: "Speichern",
  },
} as const;
