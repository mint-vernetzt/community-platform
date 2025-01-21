export const locale = {
  error: {
    notFound: "Organization not found",
    notPrivileged: "Not privileged",
    inputError: {
      doesNotExist: "No profile exists under this name.",
      alreadyAdmin:
        "The profile under this name is already an administrator of your organization.",
    },
  },
  invite: {
    success: "Invitation to {{firstName}} {{lastName}} was sent successfully.",
    error: "Invitation could not be sent.",
  },
  email: {
    subject: "You have received an invitation to become an admin!",
    button: {
      text: "To the community platform",
    },
  },
  feedback: '"{{firstName} {{lastName}}" has been added as an administrator.',
} as const;
