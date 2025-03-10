export const locale = {
  error: {
    notFound: "Organization or organization visibility not found",
    invalidRoute: "Invalid route",
    updateFailed:
      "Data could not be saved. Please try again or contact support",
  },
  validation: {
    name: {
      required: "Please enter the name of your organization or network",
      min: "Name must be at least {{min}} characters long",
      max: "Name must be at most {{max}} characters long",
    },
    email: "Please enter a valid email address",
    bio: {
      max: "Description must be at most {{max}} characters long",
    },
  },
  content: {
    notFound: "Not found",
    headline: "General",
    success: "Data saved!",
    contact: {
      headline: "Name and contact",
      name: {
        label: "What is the name of your organization / network?",
      },
      email: {
        label: "Email address",
      },
      phone: {
        label: "Phone number",
      },
      street: {
        label: "Street",
      },
      streetNumber: {
        label: "House number",
      },
      zipCode: {
        label: "Zip code",
      },
      city: {
        label: "City",
      },
    },
    about: {
      headline: "About us",
      intro:
        "Share the community basic information about your organization or network.",
    },
    bio: {
      label: "Short description",
    },
    areas: {
      label: "Activity areas",
      helper: "Multiple selection possible",
      option: "Please select",
    },
    focuses: {
      label: "Focuses",
      helper: "Multiple selection possible",
      option: "Please select",
    },
    supportedBy: {
      headline: "Funding bodies",
      label: "Funded by",
      add: "Add",
    },
  },
  form: {
    reset: "Discard changes",
    submit: "Save",
    hint: {
      public: "Visible to everyone",
      private: "Visible only to registered users",
    },
  },
} as const;
