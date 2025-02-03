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
    networkTypesRequired: "Bitte wähle mindestens eine Netzwerkform aus.",
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
      doubleCheck: {
        title: 'Organisationsform "Netzwerk" entfernen',
        description:
          "Wenn Du die Organisationsform entfernst, werden automatisch die Verbindungen zu folgenden Netzwerkmitgliedern aufgehoben: {{organizations}}",
        submit: "Entfernen",
        abort: "Abbrechen",
      },
    },
    networkTypes: {
      headline: "Netzwerkform",
      label: "Wähle die Art Deines Netzwerkes aus",
      helper: "Mehrfachauswahl möglich",
      helperWithoutNetwork: 'Benötigt Organisationsform "Netzwerk"',
      option: "Bitte auswählen",
    },
    networks: {
      current: {
        headline_one: "Aktuelles Netzwerk",
        headline_other: "Aktuelle Netzwerke",
        subline_one: "Deine Organisation ist Teil dieses Netzwerks",
        subline_other: "Deine Organisation ist Teil dieser Netzwerke",
        leave: {
          cta: "Austreten",
          success:
            "Du bist aus dem Netzwerk {{organization}} erfolgreich ausgetreten.",
        },
      },
      join: {
        headline_zero: "Ist Deine Organisation Teil eines Netzwerks?",
        headline_other: "Ist Deine Organisation Teil von anderen Netzwerken?",
        subline:
          "Suche ein Netzwerk und füge Deine Organisation als Netzwerk-Mitglied hinzu.",
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
        headline_one: "Aktuelle Mitgliedsorganisation",
        headline_other: "Aktuelle Mitgliedsorganisationen",
        subline_one: "Dein Netzwerk besteht aus dieser Mitgliedsorganisation",
        subline_other:
          "Dein Netzwerk besteht aus diesen Mitgliedsorganisationen",
        remove: {
          cta: "Entfernen",
          success:
            "Du hast die Mitgliedsorganisation {{organization}} erfolgreich aus Deinem Netzwerk entfernt.",
        },
      },
      add: {
        headline: "Organisationen zu Deiner Netzwerk-Organisation hinzufügen",
        subline:
          "Suche die Organisationen, die zu Deiner Netzwerk-Organisation gehören und füge sie hinzu.",
        label: "Organisationsname",
        placeholder: "Suche...",
        helper: "Mindestens 3 Buchstaben.",
        helperWithoutNetwork: 'Benötigt Organisationsform "Netzwerk"',
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
