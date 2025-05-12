export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
  },
  content: {
    headline: "Administrators",
    intro: {
      who: "Who manages the event on the community platform? Add or remove other administrators here.",
      what: "Administrators can edit, publish, revert to draft, cancel, and delete events. They are not visible on the event detail page.",
      whom: "Team members are shown on the event detail page. They can view events in draft but cannot edit them.",
    },
    add: {
      headline: "Add an administrator",
      intro: "Add a person as an administrator to your event here.",
    },
    current: {
      headline_one: "Current administrator",
      headline_other: "Current administrators",
      intro_one: "Here you can see the administrator of the event at a glance.",
      intro_other:
        "Here you can see the administrators of the event at a glance.",
    },
  },
  form: {
    name: {
      label: "Name or email",
    },
    remove: {
      label: "Remove",
    },
    publish: {
      label: "Publish",
    },
    hide: {
      label: "Hide",
    },
  },
} as const;
