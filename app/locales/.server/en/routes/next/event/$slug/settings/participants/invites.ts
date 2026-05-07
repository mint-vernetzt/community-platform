export const locale = {
  title: "Pending Invites",
  subline: "The following people still need to respond to your invite.",
  search: {
    label: "Search the invites",
    placeholder: "Name",
    hint: "Type at least 3 characters.",
    validation: {
      min: "Please type at least 3 characters to search.",
    },
  },
  list: {
    item: {
      invitedAt: "Invited at {{date}}",
      revoke: "Revoke invite",
    },
    more: "Show {{count}} more",
    less: "Show {{count}} less",
  },
  mail: {
    revokeInviteToParticipateOnEvent: {
      subject: "The invite to participate on the event has been revoked",
    },
  },
  errors: {
    revokeInviteToParticipateOnEvent:
      "Revoking the invite to participate on the event failed.",
  },
  success: {
    revokeInviteToParticipateOnEvent:
      "The invite to participate on the event has been successfully revoked.",
  },
} as const;
