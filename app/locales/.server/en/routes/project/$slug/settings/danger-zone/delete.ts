export const locale = {
  validation: {
    name: {
      noMatch: "The project name entered does not match.",
      required: "Please enter the name of the project.",
    },
  },
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    deletionFailed:
      "The project could not be deleted. Please try again or contact support.",
  },
  content: {
    deleted: 'Project "{{name}}" deleted.',
    confirmation:
      "Please enter the name of the project <0>{{name}}</0> to confirm deletion.",
    explanation:
      "If you then click on “Delete project”, your project will be permanently deleted without further inquiry.",
    label: "Confirm deletion",
    placeholder: "Enter project name",
    action: "Delete project",
    success: "Your project {{name}} has been successfully deleted.",
  },
} as const;
