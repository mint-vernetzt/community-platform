export const locale = {
  error: {
    notFound: "Database entry not found",
    alreadyMember: "You are already a member of the organization",
    requestFailed: "Membership request could not be sent",
    cancelRequestFailed: "Membership request could not be withdrawn",
    acceptInviteFailed: "Invitation could not be accepted",
    rejectInviteFailed: "Invitation could not be rejected",
    notAdmin: "You are not an admin of the organization",
    acceptRequestFailed: "Membership request could not be accepted",
    rejectRequestFailed: "Membership request could not be rejected",
  },
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
  requestOrganizationMembership: {
    headline: "Add me to an organization",
    subline:
      "Search for organizations, add yourself as a team member or create an organization.",
    create: "Create new organization",
    toasts: {
      organizationsFound:
        "Organizations with this name already exist. Ask if you can join an organization.",
    },
    createOrganizationMemberRequestCta: "Request to join",
    cancelOrganizationMemberRequestCta: "Cancel request to join",
    createOrganizationMemberRequest:
      "You have requested to join {{name}}. You will be notified as soon as an admin responds to your request.",
    cancelOrganizationMemberRequest:
      "You have withdrawn your membership request to {{name}}.",
    label: "Organization name",
    placeholder: "Search for organization...",
    helperText: "At least 3 letters.",
    searchCta: "Search",
    alreadyAdmin: "already admin",
    alreadyMember: "already team member",
    alreadyRequested: "already requested",
    email: {
      subject: {
        requested: "Your organization has received a membership request.",
        canceled:
          "A membership request to your organization has been withdrawn.",
      },
      button: {
        text: "To the community platform",
      },
    },
  },
  organizationMemberInvites: {
    headline: "Invites from organizations",
    subline:
      "If you accept invitations, you will become a team member or admin of the organization.",
    tabbar: {
      teamMember: "Team Member",
      admin: "Admin",
    },
    decline: "Decline invitation",
    accept: "Accept invitation",
    adminAccepted:
      "You have successfully joined the organization {{name}} as an admin.",
    memberAccepted:
      "You have successfully joined the organization {{name}} as a team member.",
    rejected: "You have declined to join the organization {{name}}.",
    more: "Show {{count}} more",
    less: "Show {{count}} less",
    email: {
      subject: {
        accepted: "Your invitation has been accepted.",
        rejected: "Your invitation has been declined.",
      },
      button: {
        text: "Zur Community Plattform",
      },
    },
  },
  networkInvites: {
    headline: "Invitations from your organizations to networks",
    subline:
      "When you confirm invitations, your organization becomes visible as a network member.",
    decline: "Decline invitation",
    accept: "Accept invitation",
    rejectNetworkInvite:
      "You have declined the invitation from {{organizationName}}.",
    acceptNetworkInvite:
      "Your organization {{organizationName}} has been added to the network {{networkName}}.",
    email: {
      subject: {
        accepted: "Your invitation has been accepted.",
        rejected: "Your invitation has been declined.",
      },
      button: {
        text: "Zur Community Plattform",
      },
    },
  },
  organizationMemberRequests: {
    headline: "Membership requests to your organizations",
    subline:
      "If you confirm membership requests, people will be visible as team members.",
    decline: "Decline membership",
    accept: "Accept membership",
    rejectOrganizationMemberRequest:
      "You have declined the membership request of {{academicTitle}} {{firstName}} {{lastName}}.",
    acceptOrganizationMemberRequest:
      "{{academicTitle}} {{firstName}} {{lastName}} has been added to your organization.",
    email: {
      subject: {
        accepted: "Your membership request has been accepted.",
        rejected: "Your membership request has been declined.",
      },
      button: {
        text: "Zur Community Plattform",
      },
    },
  },
  networkRequests: {
    headline: "Membership requests to your networks",
    subline:
      "When you confirm requests, the organizations become visible as network members.",
    decline: "Decline membership",
    accept: "Accept membership",
    rejectNetworkRequest:
      "You have declined the membership request from {{organizationName}}.",
    acceptNetworkRequest:
      "The organization {{organizationName}} has been added to your network {{networkName}}.",
    email: {
      subject: {
        accepted: "Your membership request has been accepted.",
        rejected: "Your membership request has been declined.",
      },
      button: {
        text: "Zur Community Plattform",
      },
    },
  },
  quit: {
    success: "You have successfully left the organization {{name}}.",
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
} as const;
