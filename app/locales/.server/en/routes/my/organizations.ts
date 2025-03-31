export const locale = {
  headline: "My Organizations",
  cta: "Create Organization",
  networkInfo: {
    headline: "Information on the organization type “Network”",
    sublineOne:
      "Are you a coordinator or team member of a STEM cluster, a STEM region or another network?",
    sublineTwo:
      "Read the following steps to create your organization as a <0>network organization</0>.",
    steps: {
      headline: "Set up your network correctly in 3 steps:",
      checkExisting: {
        headline:
          "Check if your network organization has already been created. If so, add yourself as a team member.",
        description:
          "To do this, go to <0>“Add me to an organization”</0>. Here you can search for your organization or network on the platform <0>and add yourself.</0> If your network organization has not yet been created, you can do this in the following step.",
      },
      createNetwork: {
        headline: "Create your network as an organization.",
        descriptionOne:
          "Create your network using the <0>“Create organization”</0> button. In the next step, you can select the <0>organization type “Network”</0> and other applicable organization types.",
        descriptionTwo:
          "Your network is now set up so that other organizations can request to join you or you can invite other organizations as network members.",
      },
      addInformation: {
        headline:
          "Now you can further fill your network organization with information.",
        description:
          "Click on the <0>“Edit”</0> button and fill in the form with relevant information so that the community is well informed about your network.",
      },
    },
    more: "Show more information",
    less: "Show less information",
  },
  invites: {
    headline: "Invites from organizations",
    subline:
      "If you accept invitations, you will become a team member or admin of the organization.",
    tabbar: {
      teamMember: "Team Member",
      admin: "Admin",
    },
    decline: "Decline invitation",
    accept: "Accept invitation",
    more: "Show {{count}} more",
    less: "Show {{count}} less",
  },
  addOrganization: {
    headline: "Add me to an organization",
    subline:
      "Search for organizations, add yourself as a team member or create an organization.",
    create: "Create new organization",
    toasts: {
      organizationsFound:
        "Organizations with this name already exist. Ask if you can join an organization.",
    },
    createRequest: "Request to join",
    cancelRequest: "Cancel request to join",
    errors: {
      invalidRoute: "No valid route",
      alreadyInRelation:
        "You have still requested to add this profile to this organization, have an invite or are already a member.",
      custom:
        "The data could not be saved. Please try again or contact the support team.",
    },
    label: "Organization name",
    placeholder: "Search for organization...",
    helperText: "At least 3 letters.",
    searchCta: "Search",
  },
  requests: {
    headline: "Membership requests to your organizations",
    subline:
      "If you confirm membership requests, people will be visible as team members.",
    decline: "Decline membership",
    accept: "Accept membership",
    createRequest:
      "You have requested to join {{organization.name}}. You will be notified as soon as an admin responds to your request.",
    cancelRequest:
      "You have withdrawn your membership request to {{organization.name}}.",
    rejectRequest:
      "You have declined the membership request of {{academicTitle}} {{firstName}} {{lastName}}.",
    acceptRequest:
      "{{academicTitle}} {{firstName}} {{lastName}} has been added to your organization.",
  },
  quit: {
    success: "You have successfully left the organization {{organization}}.",
    lastAdmin:
      "You cannot leave the organization because you are the last admin. Press edit to appoint another admin or delete the organization.",
  },
  organizations: {
    tabbar: {
      teamMember: "Team Member",
      admin: "Admin",
    },
    subline: {
      teamMember: "You are assigned to these organizations as a team member.",
      admin: "You are assigned to these organizations as an administrator.",
    },
  },
  alerts: {
    accepted: "You have successfully joined the {{organization}} organization.",
    rejected: "You have declined to join the {{organization}} organization.",
  },
  email: {
    createRequest: {
      subject: "Your organization has received a membership request.",
      button: {
        text: "To the community platform",
      },
    },
    acceptRequest: {
      subject: "Your request has been accepted.",
    },
    rejectRequest: {
      subject: "Your request has been declined.",
    },
    inviteAccepted: {
      subject: "Your invitation has been accepted.",
    },
    inviteAsAdminAccepted: {
      subject: "Your invitation has been accepted.",
    },
    inviteRejected: {
      subject: "Your invitation has been declined.",
    },
    inviteAsAdminRejected: {
      subject: "Your invitation has been declined.",
    },
  },
} as const;
