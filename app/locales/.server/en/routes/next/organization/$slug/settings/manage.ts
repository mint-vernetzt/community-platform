export const locale = {
  error: {
    notFound: "Organization not found",
    invalidRoute: "Invalid route",
    noStringIntent: "Bad request: intent is not a string",
    wrongIntent: "Bad request: wrong intent",
    updateFailed:
      "Data could not be saved. Please try again or contact support",
  },
  content: {
    notFound: "Not found",
    headline: "Manage organization",
    success: "Data saved!",
    types: {
      headline: "Organizational form",
      label: "Choose the type of your organization",
      helper: "Multiple selection possible",
      option: "Please select",
    },
    networkTypes: {
      headline: "Network form",
      label: "Choose the type of your network",
      helper: "Multiple selection possible",
      option: "Please select",
    },
    networks: {
      current: {
        headline_one: "Current network",
        headline_other: "Current networks",
        leave: "Leave",
      },
      join: {
        headline: "Is your organization part of other networks?",
        subline:
          "Search for network organizations and add your organization as a network member.",
        label: "Name of network organization",
        placeholder: "Search...",
        helper: "At least 3 characters.",
        searchCta: "Search",
        cta: "Join",
      },
    },
  },
  form: {
    reset: "Discard changes",
    submit: "Save",
  },
} as const;
