export const locale = {
  headline: "Event erstellen",
  close: "Zurück zu meinen Events",
  info: "Erstelle kostenfreie und nicht kommerzielle Veranstaltungen für die MINT-Community und Interessierte der MINT-Bildung. Angebote für <0>Kinder und Jugendliche</0> können leider <0>nicht</0> abgebildet werden. <1>Weitere Informationen findest Du auf unserer Hilfeseite.</1>",
  name: {
    headline: "Wie heißt Dein Event?",
    label: "Titel des Events*",
    helperText:
      "Mit max. 55 Zeichen im Titel kann Dein Event in der Übersicht gut dargestellt werden.",
  },
  timePeriod: {
    headline: "Handelt es sich um eine ein- oder mehrtägige Veranstaltung?",
    oneDay: {
      label: "Eintägige Veranstaltung",
    },
    multiDay: {
      label: "Mehrtägige Veranstaltung",
    },
  },
  timings: {
    headline: "Wann findet Dein Event statt?",
    startDate: {
      oneDay: {
        label: "Datum*",
      },
      multiDay: {
        label: "Startdatum*",
      },
    },
    endDate: {
      label: "Enddatum*",
    },
    startTime: {
      label: "Startzeit*",
    },
    endTime: {
      label: "Ende*",
    },
  },
  requiredHint: "*Erforderliche Angaben",
  cta: "Entwurf anlegen",
  cancel: "Verwerfen",
} as const;
