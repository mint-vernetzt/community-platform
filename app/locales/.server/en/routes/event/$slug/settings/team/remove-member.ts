export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
    minimum:
      "There must always be a team member. Please add someone else as a team member first.",
    inputError: {
      doesNotExist: "No person was found under this name.",
      alreadyIn:
        "A person with this name is already team member of your event.",
    },
  },
  feedback:
    'A new team member with the name "{{firstName}} {{lastName}}" has been added.',
} as const;
