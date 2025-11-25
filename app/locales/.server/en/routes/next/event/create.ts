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
    oneDay: {
      label: "One-day event",
    },
    multiDay: {
      label: "Multi-day event",
    },
  },
  timings: {
    headline: "When does your event take place?",
    startDate: {
      oneDay: {
        label: "Date*",
      },
      multiDay: {
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
} as const;
