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
      doubleCheck: {
        title: 'Remove organizational form "Network"',
        description:
          "If you remove the organizational form, the connections to the following network members will be automatically removed: {{organizations}}",
        submit: "Remove",
        abort: "Cancel",
      },
    },
    networkTypes: {
      headline: "Network form",
      label: "Choose the type of your network",
      helper: "Multiple selection possible",
      helperWithoutNetwork: 'Requires organizational form "Network"',
      option: "Please select",
    },
    networks: {
      current: {
        headline_one: "Current network",
        headline_other: "Current networks",
        subline_one: "Your organization is part of this network",
        subline_other: "Your organization is part of these networks",
        leave: {
          cta: "Leave",
          success: "You have successfully left the network {{organization}}.",
        },
      },
      join: {
        headline_zero: "Is your organization part of a network?",
        headline_other: "Is your organization part of other networks?",
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
        headline_one: "Current member organization",
        headline_other: "Current member organizations",
        subline_one: "Your network consists of this member organization",
        subline_other: "Your network consists of these member organizations",
        remove: {
          cta: "Remove",
          success:
            "You have successfully removed the member organization {{organization}} from your network.",
        },
      },
      add: {
        headline: "Add organizations to your network organization",
        subline:
          "Search for organizations and add them to your network organization.",
        label: "Name of organization",
        placeholder: "Search...",
        helper: "At least 3 characters.",
        helperWithoutNetwork: 'Requires organizational form "Network"',
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
