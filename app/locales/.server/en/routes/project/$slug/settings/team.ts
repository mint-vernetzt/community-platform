export const locale = {
  error: {
    invariant: {
      notFound: "Project not found",
      noStringIntent: "Bad request: intent is not a string",
      wrongIntent: "Bad request: wrong intent",
      entitiesForInviteNotFound: "Profile or project for invite not found",
      entitiesForRemovalNotFound: "Profile or project for removal not found",
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
    profileAdded: "Added {{firstName}} {{lastName}} as a team member.",
    profileInvited:
      "Invited {{firstName}} {{lastName}} to become a team member.",
    profileRemoved: "Removed team member {{firstName}} {{lastName}}.",
    inviteCancelled:
      "The invitation to {{firstName}} {{lastName}} has been withdrawn.",
    headline: "Team",
    intro:
      "Who is part of your project? Add or remove additional team members here. Team members are displayed on the projects' detail page. They cannot edit the project.",
    current: {
      headline_one: "Team member",
      headline_other: "Team members",
      remove: "Remove",
    },
    invite: {
      headline: "Invite team member",
      search: "Search",
      criteria: "At least 3 characters.",
      submitSearch: "Search",
      submit: "Invite",
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
