export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
  },
  content: {
    headline: "Linked events",
    assign: {
      headline: "Assign a main event",
      intro:
        "Which event is superior to your event? Is it part of a conference, for example? Add or remove a main event to your event here. However, you must be an administrator of the main event and your event must take place within the timeframe of the main event.",
      name: "Name of the event",
    },
    parent: {
      headline: "Current main event",
      intro: "Here you can see the current main event of your event.",
      empty: "Currently, no main event is assigned to your event.",
      seats: {
        unlimited: " | Unlimited seats",
        exact: " | {{number}} / {{total}} seats available",
        waiting: " | {{number}} on the waiting list",
      },
    },
    related: {
      headline: "Add related events",
      intro:
        "Which events are subordinate to your event? Is your event, for example, a conference with several sub-events such as workshops, panel discussions, or similar? Then add or remove other related events here. Note that you must be an administrator in the related events and that they must take place within the timeframe of your event.",
      name: "Name of the event",
    },
    current: {
      headline: "Current related events",
      intro: "Here you can see the current related events of your event.",
      empty: "Currently, your event has no related events.",
      seats: {
        unlimited: " | Unlimited seats",
        exact: " | {{number}} / {{total}} seats available",
        waiting: " | {{number}} on the waiting list",
      },
    },
  },
  form: {
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
