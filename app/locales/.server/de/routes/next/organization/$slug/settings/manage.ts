export const locale = {
  error: {
    notFound: "Organisation nicht gefunden",
    invalidRoute: "Ungültige Route",
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
  },
  form: {
    reset: "Änderungen verwerfen",
    submit: "Speichern",
  },
} as const;
