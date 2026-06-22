export const locale = {
  title: "Pending Invitations",
  explanation:
    "The admins of the following organizations still need to respond to your invitation.",
  list: {
    more: "{{count}} more",
    less: "{{count}} less",
    revoke: "Revoke Invitation",
  },
  search: {
    label: "Search Invitations",
    placeholder: "Organization Name",
    hint: "Enter at least 3 characters.",
    validation: {
      min: "Please enter at least 3 characters to search.",
    },
  },
  listItem: {
    invitedAt: "Invited on {{date}}",
  },
  mail: {
    cancelledInvitation: {
      subject: "Die Einladung wurde zurückgezogen",
    },
  },
  errors: {
    revokeInviteFailed: "Revoke invitation failed.",
  },
  success: {
    revokeInvite: "Invitation successfully revoked.",
  },
} as const;
