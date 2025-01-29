export const locale = {
  validation: {
    timeframe: {
      length:
        "Your entry exceeds the maximum permitted number of characters of {{max}}.",
    },
    jobFillings: {
      length:
        "Your entry exceeds the maximum permitted number of characters of {{max}}.",
    },
    furtherJobFillings: {
      length:
        "Your entry exceeds the maximum permitted number of characters of {{max}}.",
    },
    yearlyBudget: {
      max: "Your entry exceeds the maximum permitted number of characters of {{max}}.",
    },
    furtherFinancings: {
      length:
        "Your entry exceeds the maximum permitted number of characters of {{max}}.",
    },
    technicalRequirements: {
      length:
        "Your entry exceeds the maximum permitted number of characters of {{max}}.",
    },
    furtherTechnicalRequirements: {
      length:
        "Your entry exceeds the maximum permitted number of characters of {{max}}.",
    },
    roomSituation: {
      length:
        "Your entry exceeds the maximum permitted number of characters of {{max}}.",
    },
    furtherRoomSituation: {
      length:
        "Your entry exceeds the maximum permitted number of characters of {{max}}.",
    },
  },
  error: {
    invalidRoute: "No valid route",
    notLoggedIn: "Not logged in",
    projectNotFound: "Project not found",
    custom:
      "The data could not be saved. Please try again or contact the support team.",
  },
  content: {
    notFound: "Not found",
    success: "Data saved!",
    prompt:
      "You have unsaved changes. These will be lost if you go one step further now.",
    back: "Framework conditions",
    intro:
      "The information provided on the financial and personnel framework refers to the specified project, not to the organization in general. The information is intended to be a suggestion for those interested who want to use the project as inspiration.",
  },
  form: {
    reset: "Discard changes",
    submit: "Save",
    timeframe: {
      headline: "Timeframe",
      label: "Project start and duration",
    },
    personellSituation: {
      headline: "Personnel situation",
      jobFillings: {
        label: "Positions and/or hourly quota",
        helper:
          "How many people are involved in the realization of the project or educational offer?",
      },
      furtherJobFillings: {
        label: "Further information",
        helper:
          "Are there any other points you would like to share with other actors?",
      },
    },
    budget: {
      headline: "Financial frame",
      yearlyBudget: {
        label: "Yearly budget",
        helper:
          "Use this free text field to inform other actors about your financial resources.",
      },
      financings: {
        label: "Type of financing",
        helper: "Select the type of financing.",
        option: "Please select",
      },
      furtherFinancings: {
        label: "Further information",
        helper:
          "Use this field if you have not found a suitable type of financing.",
      },
    },
    technicalFrame: {
      headline: "Technical frame",
      technicalRequirements: {
        label: "What software/hardware/kits or machines are used?",
      },
      furtherTechnicalRequirements: {
        label: "Other notes",
      },
    },
    spatialSituation: {
      headline: "Spatial situation",
      roomSituation: {
        label: "Places of work",
        helper: "What spatial situation is necessary?",
      },
      furtherRoomSituation: {
        label: "Further information",
      },
    },
  },
} as const;
