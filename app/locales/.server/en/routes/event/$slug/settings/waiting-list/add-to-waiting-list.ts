export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
    inputError: {
      doesNotExist: "There is no profile under this name yet.",
      alreadyOn:
        "The profile under this name is already on the waitlist of your event.",
      alreadyParticipant:
        "The profile under this name is already participating in your event. Please remove the person from the participant list first.",
    },
  },
  feedback:
    'The profile with the name "{{firstName}} {{lastName}}" has been added to the waitlist.',
  action: "Waiting list",
} as const;
