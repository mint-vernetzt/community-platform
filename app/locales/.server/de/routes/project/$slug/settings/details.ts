export const locale = {
  error: {
    notFound: "Not Found",
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    storage:
      "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support.",
  },
  validation: {
    targetGroupAdditions: {
      max: "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    excerpt: {
      max: "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    idea: {
      message:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    goals: {
      message:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    implementation: {
      message:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    furtherDescription: {
      message:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    targeting: {
      message:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    hints: {
      message:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    videoSubline: {
      max: "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    custom: {
      message:
        "Zusätzliche Disziplinen können nur gewählt werden, wenn mindestens eine Hauptdisziplin ausgewählt wurde.",
    },
  },
  content: {
    feedback: "Daten gespeichert!",
    nonPersistent:
      "Du hast ungespeicherte Änderungen. Diese gehen verloren, wenn Du jetzt einen Schritt weiter gehst.",
    back: "Projekt-Details",
    description:
      "Teile der Community mehr über Dein Projekt oder Bildungsangebot mit.",
    disciplines: {
      headline: "MINT-Disziplinen",
      intro: "Welche MINT-Disziplinen spielen in Deinem Projekt eine Rolle?",
      helper: "Mehrfachnennungen sind möglich.",
      choose: "Bitte auswählen",
    },
    additionalDisciplines: {
      headline:
        "Welche zusätzlichen Disziplinen spielen in Deinem Projekt eine Rolle?",
      helper: "Mehrfachnennungen sind möglich.",
      helperWithoutDisciplines:
        "Wähle mindestens eine Hauptdisziplin aus um zusätzliche Disziplinen hinzuzufügen.",
      choose: "Bitte auswählen",
    },
    furtherDisciplines: {
      headline:
        "Welche weiteren Teildisziplinen (oder Techniken, Verfahren) spielen eine Rolle?",
      helper: "Bitte füge die Begriffe jeweils einzeln hinzu.",
      choose: "Hinzufügen",
    },
    participants: {
      headline: "Teilnehmer:innen",
      intro:
        "Wenn Dein Projekt für eine konkrete Teilnehmer:innenzahl bspw. pro Kurs konzipiert ist, gib diese bitte an.",
      helper:
        "Hier kannst Du Zahlen aber auch zusätzliche Informationen eingeben.",
    },
    projectTargetGroups: {
      intro: "Welche Zielgruppe spricht das Projekt an?",
      helper: "Mehrfachnennungen sind möglich.",
      choose: "Bitte auswählen",
    },
    specialTargetGroups: {
      intro:
        "Wird eine bestimmte (geschlechtsspezifische, soziale, kulturelle oder demografische etc.) Gruppe innerhalb der Zielgruppe angesprochen?",
      helper: "Mehrfachnennungen sind möglich.",
      choose: "Bitte auswählen",
    },
    targetGroupAdditions: {
      more: "Weitere",
    },
    shortDescription: {
      headline: "Kurztext zu Deinem Projekt",
      intro:
        "Fasse Dein Projekt in einem Satz zusammen. Dieser Text wird als Teaser angezeigt.",
      label: "Kurzbeschreibung",
    },
    extendedDescription: {
      headline: "Ausführliche Beschreibung",
      intro:
        "Nutze für Deine Beschreibungen die vorgegebenen Felder oder strukturiere Deine Projektbeschreibung mit Hilfe von selbstgewählten Überschriften in Feld “Sonstiges”.",
      idea: {
        label: "Idee",
        helper: "Beschreibe die Idee hinter Deinem Projekt.",
      },
      goals: {
        label: "Ziele",
        helper: "Beschreibe Lernziele oder mögliche Ergebnisse.",
      },
      implementation: {
        label: "Durchführung",
        helper: "Welche Schritte werden durchgeführt?",
      },
      furtherDescription: {
        label: "Sonstiges",
        helper:
          "Was möchtest Du außerdem der Community mitgeben? Nutze dieses Feld um Deine Projekt-Beschreibung mit Überschriften selbst zustrukturieren.",
      },
      targeting: {
        label: "Wie wird die Zielgruppe erreicht?",
        helper:
          "Welche Maßnahmen werden durchgeführt um die Zielgruppe anzusprechen? Womit wird geworben? Gibt es neben dem Erlernten weitere Benefits?",
      },
      hints: {
        label: "Tipps zum Nachahmen",
        helper:
          "Was kannst Du Akteur:innen mitgeben, die ein ähnliches Projekt auf die Beine stellen wollen. Was gibt es zu beachten?",
      },
    },
    video: {
      headline: "Video-Link zu Deinem Projekt",
      video: {
        label: "Einbettungslink",
        helper:
          "Kopiere die Youtube-URL deines Videos aus der Adresszeile des Browsers, nutze die Teilenfunktion oder den Embed-Link von YouTube.",
      },
      videoSubline: {
        label: "Bitte gibt hier eine Bildunterschrift für Dein Video ein.",
      },
    },
    reset: "Änderungen verwerfen",
    submit: "Speichern",
    error: {
      additionalDisciplines: "Zusätzliche Disziplinen: {{list}}",
      idea: "Ausführliche Beschreibung - Idee: {{list}}",
      goals: "Ausführliche Beschreibung - Ziele: {{list}}",
      implementation: "Ausführliche Beschreibung - Durchführung: {{list}}",
      furtherDescription: "Ausführliche Beschreibung - Sonstiges: {{list}}",
      targeting: "Ausführliche Beschreibung - Zielgruppenansprache: {{list}}",
      hints: "Ausführliche Beschreibung - Tipps: {{list}}",
    },
  },
} as const;
