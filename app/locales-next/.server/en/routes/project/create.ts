export const locale = {
  validation: {
    projectName: {
      required: "The project name is a required information.",
      max: "Your entry exceeds the maximum permitted number of characters of 80.",
    },
  },
  error: {
    invariantResponse: "You have to be logged in to access this route",
    unableToCreate:
      "The project could not be created. Please try again or contact support.",
  },
  content: {
    headline: "Create project",
    intro1:
      "Create your good practice project/educational offering and use it to inspire other STEM actors.",
    intro2:
      "Please note that you are not addressing your target group here, but rather presenting your project for STEM actors. Please read our <0>terms of use</0> carefully as we reserve the right to delete content.",
    explanation: {
      headline: "*Required information",
      intro:
        "You create a draft that only you can see. After creating the draft, you can edit your project to enrich it with information and then publish it.",
    },
  },
  form: {
    projectName: {
      label: "Title of the project or educational offer*",
    },
    submit: {
      label: "Save and edit draft",
    },
    reset: {
      label: "Discard draft",
    },
  },
} as const;
