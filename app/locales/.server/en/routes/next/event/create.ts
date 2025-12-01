export const locale = {
  headline: "Create Event",
  close: "Back to my events",
  info: "Create free and non-commercial events for the STEM community and those interested in STEM education. Unfortunately, offers for <0>children and adolescents</0> cannot be represented. <1>You can find more information on our help page.</1>",
  name: {
    headline: "What is the name of your event?",
    label: "Event title*",
    helperText:
      "With a maximum of 55 characters in the title, your event can be well displayed in the overview.",
  },
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
  cta: "Create draft",
  cancel: "Discard",
  form: {
    validation: {
      nameRequired: "Please enter a title.",
      nameMinLength: "The event name must be at least 3 characters long.",
      startDateRequired: "Please enter the start date of your event.",
      startDateInPast: "Your date is in the past.",
      endDateRequired: "Please enter the end date of your event.",
      endDateInPast: "Your end date is in the past.",
      endDateBeforeStartDate: "Your end date is before the start date.",
      startTimeRequired: "Please enter the start time.",
      endTimeRequired: "Please enter the end time.",
    },
  },
  errors: {
    createEventFailed:
      "An error occurred while creating your event. Please try again later.",
  },
} as const;
