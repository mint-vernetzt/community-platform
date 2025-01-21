export const locale = {
  error: {
    missingParameterSlug: 'Route parameter "slug" not found',
    invalidRoute: "No valid route",

    projectNotFound: "Project not found",
    invalidSubmission: "No valid submission",
    invalidAction: "No valid action",
    onStoring: "Error on storing document",
  },
  validation: {
    slug: {
      min: "At least 3 characters are required.",
      max: "A maximum of 50 characters are allowed.",
      regex: "Only letters, numbers and hyphens allowed.",
      unique: "The URL is already taken by another project.",
    },
  },
  content: {
    label: "Project URL",
    feedback: "URL changed successfully.",
    prompt:
      "You have unsaved changes. These will be lost if you go one step further now.",
    reach:
      "Your project can currently be accessed via the following URL <0>{{url}}<1>{{slug}}</1></0>.",
    note: "If you change the URL of your project and have already shared the previous link, the project will no longer be accessible via the old link.",
    action: "Change URL",
  },
} as const;
