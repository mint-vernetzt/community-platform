export const locale = {
  error: {
    profileNotFound: "Profile not found",
    notPrivileged: "Not privileged",
    notFound: "The profile could not be found",
    lastAdmin: {
      intro: "This profile is the last administrator in ",
      organizations: "the organizations: {{organizations}}",
      events: "the events: {{events}}",
      projects: "the projects: {{projects}}",
      outro:
        "which is why it cannot be deleted. Please transfer the rights to another person or first delete these organizations, events, or projects.",
    },
    serverError: "The profile could not be deleted.",
  },
  validation: {
    confirmed: {
      regex: "really delete",
      message: 'Please enter "really delete" to confirm.',
    },
  },
  content: {
    headline: "Delete profile",
    subline: "Sorry to see you go.",
    intro:
      'Please enter "really delete" to confirm the deletion. Once you click on “Permanently delete profile,” your profile will be deleted without further inquiry.',
  },
  form: {
    confirmed: {
      label: "Confirm deletion",
      placeholder: "really delete",
    },
    submit: {
      label: "Permanently delete profile",
    },
  },
} as const;
