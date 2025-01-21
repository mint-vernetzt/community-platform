export const locale = {
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
    inputError:
      "Attention! There are already more participants than the currently set participation limit. Please first add the corresponding number of participants to the waiting list.",
  },
  validation: {
    participantLimit: {
      type: "Please enter a number",
    },
  },
  content: {
    headline: "Participants",
    intro:
      "Who is participating in the event? Add more participants here or remove them. You can also set a limit on the number of participants.",
    limit: {
      headline: "Limitation of participants",
      intro:
        "Here you can limit the number of participants. Even if the participant number is reached, you can still manually move people from the waiting list to the participants later.",
      label: "Limitation of participants",
      submit: "Save",
      feedback: "Your information has been updated.",
    },
    add: {
      headline: "Add participants",
      intro:
        "Add an already existing profile as a participant to your event here.",
      label: "Name or email of the participant",
    },
    current: {
      headline: "Current participants",
      intro: "Here you can see all participants at a glance.",
      download1: "Download participant list",
      download2: "Download participant list of all sub-events",
      remove: "Remove",
    },
    hide: "Hide",
    publish: "Publish",
  },
} as const;
