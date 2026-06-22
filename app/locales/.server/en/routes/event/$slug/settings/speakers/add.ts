export const locale = {
  search: {
    title: "Add Speaker",
    explanation:
      "Invite speakers to your event. Currently, you can only invite speakers who already have a profile on the platform. The individuals must accept the invitation to be listed as a speaker.",
    label: "Search for people",
    placeholder: "Name or email address",
    hint: "Enter at least 3 characters.",
    submit: "Search",
    result_one: "{{count}} person found.",
    result_other: "{{count}} people found.",
    invite: "Invite",
    alreadySpeaker: "already a speaker",
    alreadyInvited: "already invited",
    more: "Show {{count}} more",
    less: "Show {{count}} less",
    validation: {
      min: "Please enter at least 3 characters to search.",
    },
  },
  errors: {
    inviteProfileAsSpeaker:
      "An error occurred while inviting the person as a speaker. Please try again.",
  },
  success: {
    inviteProfileAsSpeaker: "The invitation was sent successfully.",
  },
  mail: {
    buttonText: "Zur Community Plattform",
    subject: "Einladung als Speaker:in für Event {{eventName}}",
  },
} as const;
