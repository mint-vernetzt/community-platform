export const locale = {
  admins: {
    title: "Add Admins as Team Members",
    instruction:
      "Select people from your event's admin list to make them team members.",
    search: {
      label: "Search the admins",
      placeholder: "Name",
      hint: "Enter at least 3 characters.",
      validation: {
        min: "Please enter at least 3 characters to search.",
      },
    },
    list: {
      more: "{{count}} more",
      less: "{{count}} less",
      add: "Add as Admin",
    },
  },
  search: {
    title: "Invite More People as Team Members",
    explanation:
      "The people you invite must accept the invitation to become team members.",
    label: "Search for people",
    placeholder: "Name or Email Address",
    hint: "Enter at least 3 characters.",
    submit: "Search",
    result_one: "One person found.",
    result_other: "{{count}} people found.",
    invite: "Invite",
    alreadyTeamMember: "already a team member",
    alreadyInvited: "already invited",
    more: "{{count}} more",
    less: "{{count}} less",
    validation: {
      min: "Please enter at least 3 characters to search.",
    },
  },
  errors: {
    inviteProfileAsTeamMember:
      "An error occurred while inviting the person. Please try again.",
    addAdminAsTeamMember:
      "An error occurred while adding the admin as a team member. Please try again.",
  },
  success: {
    inviteProfileAsTeamMember: "The invitation was sent successfully.",
    addAdminAsTeamMember: "The admin was successfully added as a team member.",
  },
  mail: {
    buttonText: "Zur Community Plattform",
    subject: "Du wurdest als Admin zu einem Event eingeladen",
  },
} as const;
