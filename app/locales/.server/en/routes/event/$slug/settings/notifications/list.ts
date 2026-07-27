export const locale = {
  system: {
    title: "Automatic Emails",
    description: "Automatic emails are not editable.",
    list: {
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
