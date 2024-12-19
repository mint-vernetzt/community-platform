export const locale = {
  error: {
    notFound: "Organization not found",
    notPrivileged: "Not privileged",
  },
  content: {
    headline: "The administrators",
    intro1:
      "Who manages the organization on the community platform? Add or remove additional administrators here.",
    intro2:
      "Administrators can create, edit, delete organizations, as well as add team members. They are not visible on the organization's detail page.",
    intro3:
      "Team members are shown on the organization's detail page. They cannot edit organizations.",
    add: {
      headline: "Add an administrator",
      intro: "Add an existing profile to your organization here.",
      label: "Name or email",
    },
    invites: {
      headline: "Invitations",
      intro: "Here you can see all the invitations you have already sent.",
      cancel: "Cancel",
    },
    current: {
      headline_one: "Current administrator",
      headline_other: "Current administrators",
      intro_one:
        "Here you can see the administrator of the organization at a glance.",
      intro_other:
        "Here you can see the administrators of the organization at a glance.",
      remove: "Remove",
    },
  },
} as const;
