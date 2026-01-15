export const locale = {
  team: {
    title: "Add People from Your Event Team as Admins",
    instruction:
      "Select people from your event team and grant them admin rights.",
    search: {
      label: "Search the team members",
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
    title: "Invite More People as Admins",
    explanation:
      "The people you invite must accept the invitation to become admins.",
    label: "Search for people",
    placeholder: "Name or Email Address",
    hint: "Enter at least 3 characters.",
    submit: "Search",
    result_one: "One person found.",
    result_other: "{{count}} people found.",
    invite: "Invite",
    alreadyAdmin: "already Admin",
    alreadyInvited: "already Invited",
    more: "{{count}} more",
    less: "{{count}} less",
    validation: {
      min: "Please enter at least 3 characters to search.",
    },
  },
  errors: {
    inviteProfileAsAdmin:
      "An error occurred while inviting the person. Please try again.",
    addTeamMemberAsAdmin:
      "An error occurred while adding the team member as an admin. Please try again.",
  },
  success: {
    inviteProfileAsAdmin: "The invitation was sent successfully.",
    addTeamMemberAsAdmin: "The team member was successfully added as an admin.",
  },
} as const;
