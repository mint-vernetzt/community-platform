export const locale = {
  error: {
    eventNotFound: "Event not found",
    profileNotFound: "Profile not found",
    notPrivileged: "Not privileged",
    input: "The name of the event is incorrect",
    delete: "The event could not be deleted.",
  },
  content: {
    headline: "Delete event",
    intro:
      'Please enter the name of the event "{{name}}" to confirm deletion. If you then click on "Delete Event", your event will be deleted without further inquiry.',
    list: "The following event and associated events will also be deleted:",
  },
  form: {
    eventName: {
      label: "Confirm deletion",
    },
    submit: {
      label: "Delete event",
    },
    publish: {
      label: "Publish",
    },
    hide: {
      label: "Hide",
    },
  },
} as const;
