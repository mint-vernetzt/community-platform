export const locale = {
  validation: {
    name: {
      required: "Please provide an event name",
    },
    startDate: {
      required: "Please specify the start date of the event",
    },
    startTime: {
      required: "Please provide a start time",
    },
    endDate: {
      required: "Please specify the end date of the event",
      greaterThan: "The end date must not be before the start date",
    },
    endTime: {
      required: "Please specify the end time of the event",
      greaterThan:
        "The event takes place on a single day. The start time must not be after the end time",
    },
  },
  error: {
    validationFailed: "Validation failed",
  },
  content: {
    back: "Back",
    headline: "Create event",
  },
  form: {
    name: {
      label: "Event name",
    },
    startDate: {
      label: "Start date",
    },
    startTime: {
      label: "Start time",
    },
    endDate: {
      label: "End date",
    },
    endTime: {
      label: "End time",
    },
    submit: {
      label: "Create",
    },
  },
} as const;
