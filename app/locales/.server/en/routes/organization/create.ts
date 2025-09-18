export const locale = {
  error: {
    notFound: "Database entry not found",
    alreadyMember: "You are already a member of the organization",
    requestFailed: "Membership request could not be sent",
    notShadow: "Organization cannot be claimed",
    alreadyClaimed:
      "You have already requested to claim this organization or we already reviewed it",
    alreadyWithdrawn:
      "You have already withdrawn the request to claim this organization or we already reviewed it",
  },
  validation: {
    organizationName: {
      required: "Please enter the name of your organization.",
      min: "The name of the organization must be at least {{min}} characters long.",
      max: "The name of the organization may be a maximum of {{max}} characters long.",
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
      noJsSearchForm: {
        label: "Search for existing organization",
        placeholder: "Name of the organization or network",
        searchCta: "Search",
      },
      requestOrganizationMembership: {
        createOrganizationMemberRequestCta: "Request to join",
        createOrganizationMemberRequest:
          "You have requested to join {{name}}. You will be notified as soon as an admin responds to your request.",
        label: "Name of the organization / network*",
        alreadyMember: "already team member",
        alreadyRequested: "already requested",
        email: {
          subject: {
            requested: "Your organization has received a membership request.",
          },
          button: {
            text: "To the community platform",
          },
        },
      },
      similarOrganizationsFound: {
        singular: "{{count}} similar organization found.",
        plural: "{{count}} similar organizations found.",
      },
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
  claimRequest: {
    alreadyRequested: {
      description:
        "You have requested to take over this organization profile. We are reviewing your request and will get back to you via email.",
      cta: "Withdraw request",
    },
    notRequested: {
      description:
        "This organization profile was created by MINTvernetzt. If you are part of this organization, you can <0>take over this profile</0>. After our review, you will become an administrator. You can also <0>request a deletion</0>. More information can be found in the <1>help section</1>.",
      cta: "Take over",
    },
    created: {
      success: "Request sent successfully",
    },
    withdrawn: {
      success: "Request withdrawn",
    },
  },
} as const;
