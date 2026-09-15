export const locale = {
  system: {
    title: "Automatic Emails",
    description: "Automatic emails are not editable.",
    list: {
      oneDayBefore: {
        title: "Reminder – 1 Day Before",
        description: "Reminds your participants one day before",
        toggle: {
          active: "Deactivate Reminder – 1 Day Before",
          inactive: "Activate Reminder – 1 Day Before",
        },
      },
      oneHourBefore: {
        title: "Reminder – 1 Hour Before",
        description: "Reminds your participants one hour before",
        toggle: {
          active: "Deactivate Reminder – 1 Hour Before",
          inactive: "Activate Reminder – 1 Hour Before",
        },
      },
      fifteenMinutesBefore: {
        title: "Reminder – 15 Minutes Before",
        description: "Final reminder shortly before the start",
        toggle: {
          active: "Deactivate Reminder – 15 Minutes Before",
          inactive: "Activate Reminder – 15 Minutes Before",
        },
      },
      confirmation: {
        title: "Confirmation Email",
        description: "Sent after successful registration",
      },
      moveUpToParticipants: {
        title: "Move-Up Notification",
        description:
          "Sent when a spot becomes available and the next participant is moved up",
      },
      cancellation: {
        title: "Cancellation Notification",
        description: "Sent when the event is cancelled",
      },
    },
  },
} as const;
