export const locale = {
  error: {
    invariant: {
      notFound: "Organization not found",
      noStringIntent: "Bad request: intent is not a string",
      wrongIntent: "Bad request: wrong intent",
      entitiesForInviteNotFound: "Profile or organization for invite not found",
      entitiesForRemovalNotFound:
        "Profile or organization for removal not found",
      adminCount:
        "There must always be an administrator. Please add someone else as an administrator first.",
      alreadyAdmin: "This person is already an administrator.",
    },
  },
  email: {
    subject: "You have received an invitation to become an admin!",
    button: {
      text: "To the community platform",
    },
  },
  content: {
    profileInvited: "Invited {{firstName}} {{lastName}} to become an admin.",
    profileRemoved: "Removed admin {{firstName}} {{lastName}}.",
    inviteCancelled:
      "The invitation to {{firstName}} {{lastName}} has been withdrawn.",
    headline: "Administrators",
    intro:
      "Who manages the organization on the community platform? Add or remove other administrators here. Administrators can edit, cancel, and delete organizations. They are not visible on the organization detail page. Team members are shown on the organization detail page. They cannot edit them.",
    current: {
      headline_one: "Administrator",
      headline_other: "Administrators",
      remove: "Remove",
    },
    invite: {
      headline: "Invite administrator",
      search: "Search",
      criteria: "At least 3 characters.",
      submitSearch: "Search",
      alreadyInvited: "already invited",
      alreadyAdmin: "already administrator",
      submit: "Invite",
    },
    invites: {
      headline: "Invitations",
      intro: "Here you can see all the invitations you have already sent.",
      cancel: "Withdraw",
    },
  },
} as const;
