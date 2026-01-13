export const locale = {
  name: {
    headline: "Wie heißt Dein Event?",
    label: "Titel des Events*",
    helperText:
      "Mit max. 55 Zeichen im Titel kann Dein Event in der Übersicht gut dargestellt werden.",
  },
  infos: {
    headline: "Infos über Dein Event",
    types: {
      label: "Veranstaltungstyp",
      helperText: "Mehrfachauswahl ist möglich.",
      cta: "Bitte auswählen",
      notFound: "Veranstaltungstyp nicht gefunden",
    },
    subline: {
      label: "Kurzinfo",
      helperText:
        "Mit max. {{max}} Zeichen in der Kurzinfo kann Dein Event in der Übersicht gut dargestellt werden.",
    },
    description: {
      label: "Beschreibung",
      helperText:
        "Mit 400–{{max}} Zeichen verschaffst Du Deinen Teilnehmer:innen einen guten Einblick in Dein Event.",
    },
  },
  keywords: {
    headline: "Beschreibende Stichwörter",
    tags: {
      label: "Schlagworte",
      helperText: "Mehrfachauswahl ist möglich.",
      cta: "Bitte auswählen",
      notFound: "Schlagwort nicht gefunden",
    },
    eventTargetGroups: {
      label:
        "Das Event wird Praktizierenden aus folgenden Bildungsbereichen empfohlen",
      helperText: "Mehrfachauswahl ist möglich.",
      cta: "Bitte auswählen",
      notFound: "Zielgruppe nicht gefunden",
    },
    experienceLevels: {
      label: "Erfahrungsstufe",
      cta: "Bitte auswählen",
      notFound: "Erfahrungsstufe nicht gefunden",
    },
    focuses: {
      label: "MINT-Schwerpunkte",
      helperText: "Mehrfachauswahl ist möglich.",
      cta: "Bitte auswählen",
      notFound: "MINT-Schwerpunkt nicht gefunden",
    },
  },
  requiredHint: "*Erforderliche Angaben",
  cta: "Speichern",
  cancel: "Änderungen verwerfen",
  form: {
    validation: {
      nameRequired: "Bitte gib einen Titel ein.",
      nameMinLength:
        "Der Titel des Events muss mindestens 3 Zeichen lang sein.",
      sublineMaxLength:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
      descriptionMaxLength:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
  },
  errors: {
    saveFailed:
      "Beim Speichern Deiner Änderungen ist ein Fehler aufgetreten. Bitte versuche es später erneut oder kontaktiere den Support.",
  },
  success: "Daten gespeichert!",
} as const;
