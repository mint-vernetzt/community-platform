export const locale = {
  list: {
    title: "Aktuelle Teilnehmende",
    subline:
      "Hier findest Du alle Personen, die sich für Dein Event angemeldet haben. Du kannst die Liste durchsuchen und als CSV-Datei downloaden.",
    search: {
      label: "Suche Personen",
      placeholder: "Name oder E-Mail-Adresse",
    },
    remove: "Entfernen",
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    confirmation: {
      title:
        "Willst Du wirklich {{firstName}} {{lastName}} von der Teilnehmer:innenliste entfernen?",
      description: "Die entfernte Persion wird per Mail informiert.",
      submit: "Entfernen",
      abort: "Abbrechen",
    },
  },
  download: {
    title: "CSV-Datei Download",
    subline:
      "Lade hier die Liste der Teilnehmenden als CSV mit Name, Position und E-Mail-Adresse herunter.",
    hint: "<0>Hinweis zum Datenschutz<0>: Nutze die Teilnehmenden-Daten nur zur Organisation Deines Events und gib sie nicht weiter. Mit dem Download übernimmst Du Verantwortung für einen datenschutzkonformen Umgang. Details findest Du in unserer <1>Datenschutzerklärung</1> und den <2>Nutzungsbedingungen</2>.",
    action: "CSV-Datei speichern",
  },
  mail: {
    removeParticipant: {
      subject: "Du wurdest als Teilnehmer:in von einem Event entfernt",
    },
  },
  errors: {
    removeParticipant:
      "Das Entfernen der Person ist fehlgeschlagen. Bitte versuche es erneut.",
  },
  success: {
    removeParticipant:
      "Die Person wurde von der Teilnehmer:innenliste entfernt",
  },
} as const;
