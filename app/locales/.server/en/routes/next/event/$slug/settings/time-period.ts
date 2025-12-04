export const locale = {
  timePeriod: {
    headline: "Is it a one-day or multi-day event?",
    single: {
      label: "One-day event",
    },
    multi: {
      label: "Multi-day event",
    },
  },
  timings: {
    headline: "When does your event take place?",
    startDate: {
      single: {
        label: "Date*",
      },
      multi: {
        label: "Start date*",
      },
    },
    endDate: {
      label: "End date*",
    },
    startTime: {
      label: "Start time*",
    },
    endTime: {
      label: "End time*",
    },
  },
  requiredHint: "*Required information",
  cta: "Save",
  cancel: "Discard changes",
  form: {
    validation: {
      startDateRequired: "Please enter the start date of your event.",
      startDateInPast: "Your date is in the past.",
      startTimeInPast: "The start time is in the past.",
      endDateRequired: "Please enter the end date of your event.",
      endDateInPast: "Your end date is in the past.",
      endTimeInPast: "The end time is in the past.",
      endDateBeforeStartDate: "Your end date is before the start date.",
      endTimeBeforeStartTime: "The end time is before the start time.",
      startTimeRequired: "Please enter the start time.",
      endTimeRequired: "Please enter the end time.",
      eventNotInParentEventBoundaries:
        "Your event is not within the timeframe of the parent event.",
      childEventsNotInEventBoundaries:
        "Your event does not cover the period of the associated event(s).",
    },
  },
  errors: {
    saveFailed:
      "An error occurred while saving your changes. Please try again later or contact support.",
    invalidTimePeriod: "Only one-day or multi-day events are allowed.",
  },
  success: "Data saved!",
} as const;
