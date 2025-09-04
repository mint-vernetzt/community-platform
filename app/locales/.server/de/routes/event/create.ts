export const locale = {
  validation: {
    name: {
      required: "Bitte einen Eventnamen angeben",
    },
    startDate: {
      required: "Bitte gib den Beginn des Events an",
    },
    startTime: {
      required: "Bitte eine Startzeit angeben",
    },
    endDate: {
      required: "Bitte gib das Ende des Events an",
      greaterThan: "Das Enddatum darf nicht vor dem Startdatum liegen",
    },
    endTime: {
      required: "Bitte gib das Ende des Events an",
      greaterThan:
        "Das Event findet an einem Tag statt. Dabei darf die Startzeit nicht nach der Endzeit liegen",
    },
  },
  error: {
    validationFailed: "Validation failed",
  },
  content: {
    back: "Zurück",
    headline: "Event anlegen",
  },
  form: {
    name: {
      label: "Name des Events",
    },
    startDate: {
      label: "Startdatum",
    },
    startTime: {
      label: "Startzeit",
    },
    endDate: {
      label: "Enddatum",
    },
    endTime: {
      label: "Endzeit",
    },
    submit: {
      label: "Anlegen",
    },
  },
} as const;
