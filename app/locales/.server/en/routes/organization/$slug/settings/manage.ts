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
        headline_one: "Your organization is part of the following network",
        headline_other: "Your organization is part of the following networks",
        blankState: "Your organization is not yet part of any other networks.",
        leave: {
          cta: "End membership",
          success: "You have successfully left the network {{organization}}.",
        },
      },
      requestToJoin: {
        headline: "Add your organization to networks",
        subline:
          "Search for network organizations and add your organization as a network member.",
        label: "Name of network organization",
        placeholder: "Search...",
        helper: "At least 3 characters.",
        searchCta: "Search",
        cta: "Request membership",
        alreadyMemberOf: "already confirmed",
        alreadyRequested: "already requested",
        success:
          "You have successfully requested membership for the network {{organization}}.",
      },
    },
    networkMembers: {
      current: {
        headline_one: "Current member organization of your network",
        headline_other: "Current member organizations of your network",
        subline_one:
          "Your network consists of the following member organization.",
        subline_other:
          "Your network consists of the following member organizations.",
        blankState: "Your network does not yet have any member organizations.",
        remove: {
          cta: "Remove",
          success:
            "You have successfully removed the member organization {{organization}} from your network.",
        },
      },
      invite: {
        headline: "Add organizations to your network",
        subline:
          "Search for organizations and add them to your network organization.",
        label: "Name of organization",
        placeholder: "Search...",
        helper: "At least 3 characters.",
        helperWithoutNetwork: 'Requires organizational form "Network"',
        searchCta: "Search",
        cta: "Invite",
        alreadyInvited: "already invited",
        alreadyMember: "already member",
        success:
          "You have successfully invited the organization {{organization}} to your network organization.",
      },
    },
  },
  form: {
    reset: "Discard changes",
    submit: "Save",
  },
} as const;
