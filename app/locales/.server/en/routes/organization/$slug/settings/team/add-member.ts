export const locale = {
  error: {
    notFound: "Organization not found",
    notPrivileged: "Not privileged",
    inputError: {
      doesNotExist: "No profile exists under this name.",
      alreadyMember:
        "The profile under this name is already a member of your organization.",
    },
  },
  invite: {
    success: "Invitation to {{firstName}} {{lastName}} was sent successfully.",
    error: "Invitation could not be sent.",
  },
  email: {
    subject: "You have received an invitation!",
    button: {
      text: "To the community platform",
    },
  },
  feedback:
    'A new team member named "{{firstName}} {{lastName}}" has been added.',
} as const;
