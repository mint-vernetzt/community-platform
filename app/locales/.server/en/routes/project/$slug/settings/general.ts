export const locale = {
  validation: {
    name: {
      required: "The project name is a required information.",
      min: "Name must be at least {{min}} characters long",
      max: "Name must be at most {{max}} characters long",
    },
    subline: {
      max: "Subline must be at most {{max}} characters long",
    },
    email: {
      email: "Please enter a valid e-mail address.",
    },
  },
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    storage:
      "The data could not be saved. Please try again or contact the support team.",
  },
  content: {
    notFound: "Not Found",
    feedback: "Data saved!",
    back: "Create key data",
    intro:
      "Share basic information about your project or educational offering with the community.",
    projectTitle: {
      headline: "Project title",
      label: "Title of the project or educational offer*",
      helper:
        "Your project will be well presented with a maximum of 55 characters.",
    },
    subline: {
      headline: "Project subline",
      label: "Subline of your project or educational offer",
      helper:
        "With a maximum of 90 characters, your project will be well presented in the overview.",
    },
    formats: {
      headline: "Project format",
      label: "What format does the project take place in?",
      helper: "Multiple entries are possible.",
      choose: "Please select",
    },
    furtherFormats: {
      label: "Further formats",
      helper: "Please provide short terms.",
      add: "Add",
    },
    areas: {
      headline: "Areas of activity",
      label: "Where is the project/educational offering carried out?",
      helper: "Multiple entries are possible.",
      option: "Please select",
    },
    contact: {
      headline: "Contact",
      email: {
        label: "E-mail address",
      },
      phone: {
        label: "Phone",
      },
    },
    address: {
      headline: "Address",
      contactName: {
        label: "Name",
      },
      street: {
        label: "Street",
      },
      streetNumber: {
        label: "House number",
      },
      streetNumberAddition: {
        label: "House number addition",
      },
      zipCode: {
        label: "ZIP Code",
      },
      city: {
        label: "City",
      },
    },
    reset: "Discard changes",
    submit: "Save",
    hint: "*Required information",
  },
} as const;
