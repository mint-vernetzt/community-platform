export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
    inputError: {
      doesNotExist: "There is no profile under this name yet.",
      alreadyIn:
        "The profile under this name is already participating in your event.",
    },
  },
  feedback:
    'The profile with the name "{{firstName}} {{lastName}}" has been added as a participant.',
  action: "Participate",
} as const;
