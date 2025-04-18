export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
    minimum:
      "There must always be a team member. Please add someone else as a team member first.",
    inputError: {
      doesNotExist: "There is no profile under this name yet.",
      alreadyIn:
        "The profile under this name is already a team member of your event.",
    },
  },
  feedback:
    'A new team member with the name "{{firstName}} {{lastName}}" has been added.',
} as const;
