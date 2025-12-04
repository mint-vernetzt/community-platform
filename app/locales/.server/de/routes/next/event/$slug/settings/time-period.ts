export const locale = {
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
  cta: "Speichern",
  cancel: "Änderungen verwerfen",
  form: {
    validation: {
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
    saveFailed:
      "Beim Speichern Deiner Änderungen ist ein Fehler aufgetreten. Bitte versuche es später erneut oder kontaktiere den Support.",
    invalidTimePeriod:
      "Es ist nur eine ein- oder mehrtägige Veranstaltung zulässig.",
  },
  success: "Daten gespeichert!",
} as const;
