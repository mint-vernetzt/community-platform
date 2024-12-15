export const locale = {
  validation: {
    organizationName: {
      required: "Please enter the name of your organization.",
      min: "Please enter the name of your organization. The organization name must be at least 3 characters long.",
    },
  },
  content: {
    back: "Back",
    headline: "Create organization or network",
  },
  form: {
    organizationName: {
      label: "Name of the Organization*",
    },
    submit: {
      label: "Create",
    },
    error: {
      sameOrganization:
        'Organizations with a similar name were found. If you want to create the organization with the name "{{searchQuery}}", click on "Create" again.',
    },
  },
} as const;
