export const locale = {
  error: {
    invariant: {
      notFound: "Organization not found",
      noStringIntent: "Bad request: intent is not a string",
      wrongIntent: "Bad request: wrong intent",
      entitiesForInviteNotFound: "Profile or organization for invite not found",
      entitiesForRemovalNotFound:
        "Profile or organization for removal not found",
      teamMemberCount:
        "There must always be a team member. Please add someone else as a team member first.",
    },
  },
  email: {
    subject: "You have received an invitation!",
    button: {
      text: "To the community platform",
    },
  },
  content: {
    profileInvited:
      "Invited {{firstName}} {{lastName}} to become a team member.",
    profileRemoved: "Removed team member {{firstName}} {{lastName}}.",
    inviteCancelled:
      "The invitation to {{firstName}} {{lastName}} has been withdrawn.",
    headline: "Team",
    intro:
      "Who is part of your organization? Add or remove additional team members here. Team members are displayed on the organizations' detail page. They cannot edit the organization.",
    current: {
      headline_one: "Team member",
      headline_other: "Team members",
      remove: "Remove",
    },
    add: {
      headline: "Add team member",
      search: "Search",
      criteria: "At least 3 characters.",
      submitSearch: "Search",
      submit: "Add",
    },
    invites: {
      headline: "Invitations",
      intro: "Here you can see all the invitations you have already sent.",
      cancel: "Withdraw",
    },
  },
} as const;
