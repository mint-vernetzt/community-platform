export const locale = {
  error: {
    invalidRoute: "No valid route",
  },
  validation: {
    slug: {
      min: "At least 3 characters are required.",
      max: "A maximum of 50 characters are allowed.",
      regex: "Only letters, numbers and hyphens allowed.",
      unique: "The URL is already taken by another organization.",
    },
  },
  content: {
    label: "Organization URL",
    feedback: "URL changed successfully.",
    reach:
      "Your organization can currently be accessed via the following URL <0>{{url}}<1>{{slug}}</1></0>.",
    note: "If you change the URL of your organization and have already shared the previous link, the organization will no longer be accessible via the old link.",
    action: "Change URL",
  },
} as const;
