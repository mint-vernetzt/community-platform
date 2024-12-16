export const locale = {
  validation: {
    confirmedToken: {
      regex: "really delete",
      message: 'Please enter "really delete".',
    },
  },
  error: {
    serverError: "The organization could not be deleted.",
    validation: "Validation failed",
    notPrivileged: "Not privileged",
    notFound: "Profile not found",
  },
  content: {
    headline: "Delete organization",
    intro: "It's unfortunate that you want to delete your organization.",
    confirmation:
      "Please enter \"really delete\" to confirm the deletion. If you click on 'Permanently delete organization' afterwards, your organization will be deleted without further inquiry.",
  },
  form: {
    confirmedToken: {
      label: "Confirm deletion",
      placeholder: "really delete",
    },
    submit: {
      label: "Permanently delete organization",
    },
  },
} as const;
