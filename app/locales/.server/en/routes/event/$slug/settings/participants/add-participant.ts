export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
    inputError: {
      doesNotExist: "No person was found under this name.",
      alreadyIn:
        "A person with this name is already participating in your event.",
    },
  },
  feedback:
    'The profile with the name "{{firstName}} {{lastName}}" has been added as a participant.',
  action: "Participate",
} as const;
