export const locale = {
  error: {
    notFound: "Organization not found",
    organizationTypeNetworkNotFound: "Organization type network not found",
    invalidRoute: "Invalid route",
    noStringIntent: "Bad request: intent is not a string",
    wrongIntent: "Bad request: wrong intent",
    updateFailed:
      "Data could not be saved. Please try again or contact support",
    notAllowed:
      "Your organization must have the organizational form network to make this action",
    networkTypesRequired: "Please select at least one network form.",
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
      headlineWithoutNetwork:
        "Network form (Requires organizational form network)",
      label: "Choose the type of your network",
      helper: "Multiple selection possible",
      option: "Please select",
    },
    networks: {
      current: {
        headline_one: "Current network",
        headline_other: "Current networks",
        leave: {
          cta: "Leave",
          success: "You have successfully left the network {{organization}}.",
        },
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
        success: "You have successfully joined the network {{organization}}.",
      },
    },
    networkMembers: {
      current: {
        headline_one:
          "Current member organization of your network organization",
        headline_other:
          "Current member organizations of your network organization",
        remove: {
          cta: "Remove",
          success:
            "You have successfully removed the member organization {{organization}} from your network organization.",
        },
      },
      add: {
        headline: "Add organizations to your network organization",
        headlineWithoutNetwork:
          "Add organizations to your network organization (Requires organizational form network)",
        subline:
          "Search for organizations and add them to your network organization.",
        label: "Name of organization",
        placeholder: "Search...",
        helper: "At least 3 characters.",
        searchCta: "Search",
        cta: "Add",
        success:
          "You have successfully added the organization {{organization}} to your network organization.",
      },
    },
  },
  form: {
    reset: "Discard changes",
    submit: "Save",
  },
} as const;
