export const locale = {
  validation: {
    name: {
      required: "Bitte einen Veranstaltungsnamen angeben",
    },
    startDate: {
      required: "Bitte gib den Beginn der Veranstaltung an",
    },
    startTime: {
      required: "Bitte eine Startzeit angeben",
    },
    endDate: {
      required: "Bitte gib das Ende der Veranstaltung an",
      greaterThan: "Das Enddatum darf nicht vor dem Startdatum liegen",
    },
    endTime: {
      required: "Bitte gib das Ende der Veranstaltung an",
      greaterThan:
        "Die Veranstaltung findet an einem Tag statt. Dabei darf die Startzeit nicht nach der Endzeit liegen",
    },
  },
  error: {
    validationFailed: "Validation failed",
  },
  content: {
    back: "Zurück",
    headline: "Veranstaltung anlegen",
  },
  form: {
    name: {
      label: "Name der Veranstaltung",
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
