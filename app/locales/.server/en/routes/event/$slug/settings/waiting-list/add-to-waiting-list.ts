export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
    inputError: {
      doesNotExist: "No person was found under this name.",
      alreadyOn:
        "A person with this name is already on the waiting list of your event.",
      alreadyParticipant:
        "A person with this name is already participating in your event. Please remove them from the participant list first.",
    },
  },
  feedback:
    'The profile with the name "{{firstName}} {{lastName}}" has been added to the waitlist.',
  action: "Waiting list",
} as const;
