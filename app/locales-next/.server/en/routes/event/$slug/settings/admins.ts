export const locale = {
  error: {
    notFound: "Event not found",
    notProvileged: "Not privileged",
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
      intro: "Add an already existing profile to your event here.",
    },
    current: {
      headline: "Current administrators",
      intro:
        "Here you can see all the administrators of the event at a glance.",
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
