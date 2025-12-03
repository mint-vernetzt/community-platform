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
    single: {
      label: "Eintägige Veranstaltung",
    },
    multi: {
      label: "Mehrtägige Veranstaltung",
    },
  },
  timings: {
    headline: "Wann findet Dein Event statt?",
    startDate: {
      single: {
        label: "Datum*",
      },
      multi: {
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
  form: {
    validation: {
      nameRequired: "Bitte gib einen Titel ein.",
      nameMinLength: "Der Name es Events muss mindestens 3 Zeichen lang sein.",
      startDateRequired: "Bitte gib das Startdatum Deines Events an.",
      startDateInPast: "Dein Datum liegt in der Vergangenheit.",
      startTimeInPast: "Die Startzeit liegt in der Vergangenheit.",
      endDateRequired: "Bitte gib das Enddatum Deines Events an.",
      endDateInPast: "Dein Enddatum liegt in der Vergangenheit.",
      endTimeInPast: "Die Endzeit liegt in der Vergangenheit.",
      endDateBeforeStartDate: "Dein Enddatum liegt vor dem Startdatum.",
      endTimeBeforeStartTime: "Die Endzeit liegt vor der Startzeit.",
      startTimeRequired: "Bitte gib die Startzeit an.",
      endTimeRequired: "Bitte gib die Endzeit an.",
    },
  },
  errors: {
    createEventFailed:
      "Beim Erstellen Deines Events ist ein Fehler aufgetreten. Bitte versuche es später erneut.",
  },
} as const;
