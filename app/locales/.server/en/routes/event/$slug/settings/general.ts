export const locale = {
  validation: {
    name: {
      required: "Please provide the name of the event",
    },
    startDate: {
      required: "Please specify the start date of the event",
    },
    startTime: {
      required: "Please specify the start time of the event",
    },
    endDate: {
      required: "Please specify the end date of the event",
      greaterThan: "The end date must not be before the start date",
    },
    endTime: {
      required: "Please specify the end time of the event",
      greaterThan:
        "The event takes place on a single day. The start time must not be after the end time",
    },
    participationUntilDate: {
      required: "Please specify the end date of the registration period",
      greaterThan:
        "The end date of the registration must not be before the start date of the registration",
    },
    participationUntilTime: {
      required: "Please specify the end time of the registration period",
      greaterThan:
        "The registration period takes place on a single day. The start time of registration must not be after the end time of registration",
    },
    participationFromDate: {
      required: "Please specify the start date of the registration period",
      greaterThan:
        "The start date must not be after the end date of the registration",
    },
    participationFromTime: {
      required: "Please specify the start time of the registration period",
      greaterThan:
        "The registration phase starts on the same day as the event. The start time of registration must not be after the start time of the event",
    },
  },
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
  },
  content: {
    headline: "Your event",
    start: {
      headline: "Start and registration",
      intro:
        "When does your event start, how long does it last, and how many people can participate? Here you can make settings around the start and registration of the event. You can also publish or hide the event and cancel it if necessary.",
    },
    cancel: "Cancel",
    revert: "Undo cancellation",
    location: "Event location",
    generic: {
      headline: "General",
      intro:
        "What is the name of your event? What can potential participants expect, and whom do you want to reach? Make general settings here, such as the name, description, or target groups and content of your event. Here you can also set keywords and event types.",
    },
    feedback: "Information has been updated.",
  },
  form: {
    startDate: {
      label: "Starts on",
    },
    startTime: {
      label: "Starts at",
    },
    endDate: {
      label: "Ends on",
    },
    endTime: {
      label: "Ends at",
    },
    participationFromDate: {
      label: "Registration starts on",
    },
    participationFromTime: {
      label: "Registration starts at",
    },
    participationUntilDate: {
      label: "Registration ends on",
    },
    participationUntilTime: {
      label: "Registration ends at",
    },
    stage: {
      label: "Event type",
      placeholder: "Select the event type.",
    },
    venueName: {
      label: "Name of the event location",
    },
    venueStreet: {
      label: "Street name",
    },
    venueStreetNumber: {
      label: "Street number",
    },
    venueZipCode: {
      label: "ZIP code",
    },
    venueCity: {
      label: "City",
    },
    conferenceLink: {
      label: "Conference link",
    },
    conferenceCode: {
      label: "Conference code",
    },
    name: {
      label: "Name",
    },
    subline: {
      label: "Subline",
    },
    description: {
      label: "Description",
    },
    types: {
      label: "Event types",
      placeholder: "Add event types.",
    },
    tags: {
      label: "Tags",
      placeholder: "Select tags.",
    },
    targetGroups: {
      label: "Target groups",
      placeholder: "Add target groups.",
    },
    experienceLevel: {
      label: "Experience level",
      placeholder: "Select the experience level.",
    },
    focuses: {
      label: "focuses",
      placeholder: "Add focuses.",
    },
    reset: {
      label: "Discard changes",
    },
    submit: {
      label: "Save",
    },
    publish: {
      label: "Publish",
    },
    hide: {
      label: "Hide",
    },
  },
} as const;
