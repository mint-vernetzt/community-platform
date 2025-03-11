export const locale = {
  validation: {
    organizationName: {
      required: "Please enter the name of your organization.",
      min: "The name of the organization must be at least 3 characters long.",
      max: "The name of the organization may be a maximum of 80 characters long.",
    },
    organizationTypeNetworkNotFound: "Organization type network not found",
    notANetwork:
      "Your organization must have the organizational form network to add network forms",
    networkTypesRequired: "Please select at least one network form.",
  },
  back: "My organizations",
  headline: "Create organization",
  form: {
    organizationName: {
      headline: "What is the name of your organization or network?",
      label: "Name of the organization / network*",
      sameOrganization:
        'Organizations with similar names were found. If you still want to create the organization with the name "{{searchQuery}}", click on "Create organization" again.',
    },
    organizationTypes: {
      cta: "Please select",
      headline: "What type of organization is it?",
      label: "Organization type",
      helperText: "Multiple selection is possible",
      notFound:
        "The type of organization could not be found. Please contact support.",
    },
    networkTypes: {
      cta: "Please select",
      headline: "What type of network is it?",
      label: "Network type",
      helper: "Multiple selection is possible",
      helperWithoutNetwork: 'Requires organizational form "Network"',
      notFound:
        "The type of network could not be found. Please contact support.",
    },
    helperText: "*Required information",
    cancel: "Cancel",
    submit: "Create organization",
  },
  successAlert:
    '<p>You have successfully created your organization {{name}}. You are a team member and admin of your organization. Now edit your organization and make it more visible to the community. <a href="/organization/{{slug}}/settings" class="hover:mv-underline mv-text-primary">Edit now</a></p>',
} as const;
