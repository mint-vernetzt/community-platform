export const locale = {
  limit: {
    headline: "Begrenzung der Teilnehmenden",
    subline:
      "Lege eine maximale Teilnehmendenzahl fest. Wenn diese erreicht ist, landen weitere Anmeldungen auto-matisch auf der Warteliste.",
    form: {
      participantLimit: {
        label: "Max. Anzahl von Teilnehmenden",
        placeholder: "Gib eine Zahl an.",
        helper:
          "Wenn Du keine Zahl angibst, wird Dein Event mit der Info “Ohne Teilnahmebeschränkung” dargestellt.",
      },
      hint: "Auch wenn die maximale Teilnehmendenanzahl erreicht ist, kannst Du Personen von der Warteliste hinzufügen oder weitere Personen einladen.",
      reset: "Änderungen verwerfen",
      submit: "Eingabe speichern",
    },
  },
  waitingList: {
    headline: "Umgang mit der Warteliste",
    subline:
      "Bestimme, was passieren soll, wenn Plätze in Deinem Event frei werden.",
    form: {
      moveUpToParticipants: {
        label: "Wartende sollen automatisch nachrücken.",
      },
      hint: "Unabhängig, ob Deine Wartenden automatisch nachrücken, kannst Du immer auch manuell Perso-nen von der Warteliste als Teilnehmende zulassen.",
      submit: "Speichern",
    },
  },
  errors: {
    moveUpToParticipants:
      "Beim Aktualisieren der Einstellung ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    participantLimit:
      "Beim Aktualisieren der Einstellung ist ein Fehler aufgetreten. Bitte versuche es erneut.",
  },
  success: {
    moveUpToParticipants: "Einstellung erfolgreich aktualisiert.",
    participantLimit: "Einstellung erfolgreich aktualisiert.",
  },
} as const;
