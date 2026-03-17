export const locale = {
  title: "Current Team",
  explanation:
    "<0>Please note</0>: There must be <0>at least one team member</0>.",
  list: {
    more: "Show {{count}} more",
    less: "Show {{count}} less",
    searchPlaceholder: "Search for team members...",
    remove: "Remove",
  },
  confirmation: {
    title: "Do you really want to remove yourself as a team member?",
    description:
      "If you remove yourself as a team member, you will no longer have access to edit your event.",
    confirm: "Remove as team member",
    abort: "Cancel",
  },
  errors: {
    removeLastTeamMember:
      "You cannot remove the last team member of the event.",
    removeTeamMemberFailed: "Removing the team member has failed.",
  },
  success: {
    removeSelfAsTeamMember:
      "You have successfully removed yourself as a team member from the event {{eventName}}.",
    removeTeamMember: "The team member has been successfully removed.",
  },
  mail: {
    subject: "Du wurdest als Teammitglied eines Events entfernt",
  },
} as const;
