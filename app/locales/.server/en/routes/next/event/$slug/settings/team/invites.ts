export const locale = {
  title: "Pending Invites",
  explanation: "The following people still need to respond to your invitation.",
  list: {
    more: "Show {{count}} more",
    less: "Show {{count}} less",
    revoke: "Revoke invite",
  },
  search: {
    label: "Search invites",
    placeholder: "Name",
    hint: "Enter at least 3 characters.",
    validation: {
      min: "Please enter at least 3 characters to search.",
    },
  },
  mail: {
    cancelledInvitation: {
      subject: "The invitation has been withdrawn",
    },
  },
  errors: {
    revokeInviteFailed: "Failed to revoke the invite.",
  },
  success: {
    revokeInvite: "The invite was successfully revoked.",
  },
} as const;
