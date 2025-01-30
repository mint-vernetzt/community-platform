export const locale = {
  error: {
    notFound: "Organisation nicht gefunden",
    organizationTypeNetworkNotFound:
      "Organisationsform Netzwerk nicht gefunden",
    invalidRoute: "Ungültige Route",
    noStringIntent: "Bad request: intent is not a string",
    wrongIntent: "Bad request: wrong intent",
    updateFailed:
      "Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support",
    notAllowed:
      "Deine Organisation muss die Organisationsform Netzwerk haben um die Aktion durchzuführen",
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
        leave: {
          cta: "Austreten",
          success:
            "Du bist aus dem Netzwerk {{organization}} erfolgreich ausgetreten.",
        },
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
        success:
          "Du bist dem Netzwerk {{organization}} erfolgreich beigetreten.",
      },
    },
    networkMembers: {
      current: {
        headline_one:
          "Aktuelle Mitgliedsorganisation Deiner Netzwerk-Organisation",
        headline_other:
          "Aktuelle Mitgliedsorganisationen Deiner Netzwerk-Organisation",
        remove: {
          cta: "Entfernen",
          success:
            "Du hast die Mitgliedsorganisation {{organization}} erfolgreich aus Deiner Netzwerk-Organisation entfernt.",
        },
      },
      add: {
        headline: "Organisationen zu Deiner Netzwerk-Organisation hinzufügen",
        subline:
          "Suche die Organisationen, die zu Deiner Netzwerk-Organisation gehören und füge sie hinzu.",
        label: "Organisationsname",
        placeholder: "Suche...",
        helper: "Mindestens 3 Buchstaben.",
        searchCta: "Suchen",
        cta: "Hinzufügen",
        success:
          "Du hast die Organisation {{organization}} erfolgreich zu Deiner Netzwerk-Organisation hinzugefügt.",
      },
    },
  },
  form: {
    reset: "Änderungen verwerfen",
    submit: "Speichern",
  },
} as const;
