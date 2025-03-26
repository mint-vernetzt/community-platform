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
        headline_one: "Deine Organisation ist Teil von folgendem Netzwerk",
        headline_other: "Deine Organisation ist Teil von folgenden Netzwerken",
        leave: {
          cta: "Mitgliedschaft beenden",
          success:
            "Du bist erfolgreich aus dem Netzwerk {{organization}} ausgetreten.",
        },
      },
      requestToJoin: {
        headline: "Deine Organisation zu Netzwerken hinzufügen",
        subline:
          "Suche die Netzwerk-Organisationen und füge Deine Organisation als Netzwerkmitglied hinzu.",
        label: "Name der Netzwerk-Organisation",
        placeholder: "Suche...",
        helper: "Mindestens 3 Buchstaben.",
        searchCta: "Suchen",
        cta: "Beitritt anfragen",
        alreadyMemberOf: "Beitritt bereits bestätigt",
        alreadyRequested: "Beitritt angefragt",
        success:
          "Du hast den Beitritt zum Netzwerk {{organization}} erfolgreich angefragt.",
      },
    },
    networkMembers: {
      current: {
        headline_one: "Aktuelle Mitgliedsorganisation Deines Netzwerks",
        headline_other: "Aktuelle Mitgliedsorganisationen Deines Netzwerks",
        subline_one:
          "Dein Netzwerk besteht aus folgender Mitgliedsorganisation.",
        subline_other:
          "Dein Netzwerk besteht aus folgenden Mitgliedsorganisationen.",
        remove: {
          cta: "Entfernen",
          success:
            "Du hast die Mitgliedsorganisation {{organization}} erfolgreich aus Deinem Netzwerk entfernt.",
        },
      },
      invite: {
        headline: "Organisationen zu Deinem Netzwerk hinzufügen",
        subline:
          "Suche die Organisationen, die zu Deiner Netzwerk-Organisation gehören und füge sie hinzu.",
        label: "Organisationsname",
        placeholder: "Suche...",
        helper: "Mindestens 3 Buchstaben.",
        helperWithoutNetwork: 'Benötigt Organisationsform "Netzwerk"',
        searchCta: "Suchen",
        cta: "Einladen",
        alreadyInvited: "bereits eingeladen",
        alreadyMember: "bereits Mitglied",
        success:
          "Du hast die Organisation {{organization}} erfolgreich zu Deiner Netzwerk-Organisation eingeladen.",
      },
    },
  },
  form: {
    reset: "Änderungen verwerfen",
    submit: "Speichern",
  },
} as const;
