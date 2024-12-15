export const locale = {
  error: {
    notPrivileged: "Not privileged",
    notFound: "Your organization could not be found.",
    inputError: {
      doesNotExist: "No organization exists under this name.",
      alreadyMember:
        "The specified organization is already part of your network.",
    },
    serverError:
      "Unfortunately, the organization could not be added to your network.",
  },
  content: {
    headline: "Add network member",
    intro: "Add an existing organization to your network here.",
    label: "Name of the organization",
  },
  feedback: 'The organization "{{title}}" is now part of your network.',
} as const;
