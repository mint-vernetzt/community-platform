export const locale = {
  error: {
    invariant: {
      notFound: "Project not found",
      noStringIntent: "Bad request: intent is not a string",
      wrongIntent: "Bad request: wrong intent",
      entitiesForInviteNotFound: "Organization or project for invite not found",
      entitiesForRemovalNotFound:
        "Organization or project for removal not found",
      alreadyResponsible: "Organization is already responsible",
    },
  },
  email: {
    subject: "You have received an invitation!",
    button: {
      text: "To the community platform",
    },
  },
  content: {
    organizationAdded: "{{name}} added as a responsible organization.",
    organizationInvited:
      "{{name}} has been invited to become a responsible organization.",
    organizationRemoved: "{{name}} removed as a responsible organization.",
    inviteCancelled: "The invitation to {{name}} has been withdrawn.",
    headline: "Responsible Organizations",
    intro:
      "Which organizations are behind the project? Manage the responsible organizations here.",
    current: {
      headline_one: "Currently added organization",
      headline_other: "Currently added organizations",
      remove: "Remove",
    },
    addOwn: {
      headline_one: "Add own organization",
      headline_other: "Add own organizations",
      search: "Search",
      criteria: "At least 3 characters.",
      submitSearch: "Search",
      alreadyResponsible: "already responsible",
      submit: "Add",
    },
    addOther: {
      headline: "Add other organizations",
      search: {
        label: "Search",
        helper: "At least 3 characters.",
      },
      alreadyResponsible: "already responsible",
      add: "Add",
    },
    invite: {
      headline: "Invite organization",
      search: "Search",
      criteria: "At least 3 characters.",
      submitSearch: "Search",
      alreadyResponsible: "already responsible",
      alreadyInvited: "already invited",
      submit: "Invite",
    },
    invites: {
      headline: "Invitations",
      intro: "Here you can see all the invitations you have already sent.",
      cancel: "Withdraw",
    },
  },
} as const;
