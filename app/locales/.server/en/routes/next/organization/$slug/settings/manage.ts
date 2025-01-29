export const locale = {
  error: {
    notFound: "Organization not found",
    invalidRoute: "Invalid route",
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
  },
  form: {
    reset: "Discard changes",
    submit: "Save",
  },
} as const;
