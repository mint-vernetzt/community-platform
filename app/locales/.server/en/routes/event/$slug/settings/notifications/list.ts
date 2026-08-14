export const locale = {
  system: {
    title: "Automatic Emails",
    description: "Automatic emails are not editable.",
    list: {
      oneDayBefore: {
        title: "Reminder – 1 Day Before",
        description: "Reminds your participants one day before",
      },
      oneHourBefore: {
        title: "Reminder – 1 Hour Before",
        description: "Reminds your participants one hour before",
      },
      fifteenMinutesBefore: {
        title: "Reminder – 15 Minutes Before",
        description: "Final reminder shortly before the start",
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
