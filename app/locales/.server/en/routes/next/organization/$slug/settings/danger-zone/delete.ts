export const locale = {
  validation: {
    name: {
      noMatch: "The organization name entered does not match.",
      required: "Please enter the name of the organization.",
    },
  },
  error: {
    invalidRoute: "No valid route",
    organizationNotFound: "Organization not found",
  },
  content: {
    deleted: 'Organization "{{name}}" deleted.',
    confirmation:
      "Please enter the name of the organization <0>{{name}}</0> to confirm deletion.",
    explanation:
      "If you then click on “Delete organization”, your organization will be permanently deleted without further inquiry.",
    label: "Confirm deletion",
    placeholder: "Enter organization name",
    action: "Delete organization",
    success: "Your organization {{name}} has been successfully deleted.",
  },
} as const;
