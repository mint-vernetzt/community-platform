export const locale = {
  ownOrganizations: {
    title: "Add Own Organizations as Responsible Organizations",
    instruction:
      "Add one or more of your organizations as responsible organizations to your event.",
    list: {
      more: "{{count}} more",
      less: "{{count}} less",
      add: "Add",
    },
    search: {
      label: "Search Organizations",
      placeholder: "Organization Name",
      hint: "Enter at least 3 characters.",
      validation: {
        min: "Please enter at least 3 characters to search.",
      },
    },
  },
  search: {
    title: "Add Other Organizations",
    explanation:
      "Invite an existing organization to your event as a responsible organization. The admins of the organizations you invite must accept the invitation to be listed as responsible organizations.",
    label: "Search Organizations",
    placeholder: "Organization Name",
    hint: "Enter at least 3 characters.",
    submit: "Search",
    result_one: "Found {{count}} organization.",
    result_other: "Found {{count}} organizations.",
    invite: "Invite",
    alreadyResponsibleOrganization: "Already a responsible organization",
    alreadyInvited: "Already invited",
    more: "{{count}} more",
    less: "{{count}} less",
    validation: {
      min: "Please enter at least 3 characters to search.",
    },
  },
  errors: {
    inviteResponsibleOrganization:
      "An error occurred while inviting the organization. Please try again.",
    addOwnOrganization:
      "An error occurred while adding your own organization as a responsible organization. Please try again.",
  },
  success: {
    inviteResponsibleOrganization: "The invitation was sent successfully.",
    addOwnOrganization:
      "Your own organization was successfully added as a responsible organization.",
  },
  mail: {
    buttonText: "Zur Community Plattform",
    subject:
      "Deine Organisation wurde als verantwortliche Organisation zu einem Event eingeladen",
  },
} as const;
