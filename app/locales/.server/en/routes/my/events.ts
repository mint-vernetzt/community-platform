export const locale = {
  title: "My Events",
  create: "Create event",
  placeholder: {
    title: "You have not participated in any event yet.",
    description: "Explore events and get to know the community better.",
    cta: "Explore events",
  },
  invites: {
    title: "Invitations for events",
    description:
      "By accepting invitations, you become an admin, team member, or speaker of the event.",
  },
  canceled: {
    title_one: "Canceled Event",
    title_other: "Canceled Events",
    description_one: "An event you signed up for has been canceled.",
    description_other: "{{count}} events you signed up for have been canceled.",
  },
  upcoming: {
    title_one: "Upcoming Event",
    title_other: "Upcoming Events",
  },
  past: {
    title_one: "Past Event",
    title_other: "Past Events",
  },
  tabBar: {
    adminEvents: "Admin",
    adminInvites: "Admin",
    teamMemberEvents: "Team Member",
    teamMemberInvites: "Team Member",
    speakerEvents: "Speaker",
    speakerInvites: "Speaker",
    responsibleOrganizationEvents: "Responsible Organization",
    responsibleOrganizationInvites: "Responsible Organization",
    participantEvents: "Participant",
    waitingListEvents: "Waiting List",
  },
  list: {
    more: "Show {{count}} more",
    less: "Show {{count}} less",
    waitinglist: "Waiting List Seats",
    seatsFree: "seats free",
    unlimitedSeats: "Unlimited seats",
    participate: "Participate",
    accept: "Accept invite",
    reject: "Reject invite",
  },
  errors: {
    acceptInviteAsAdmin: "Error accepting invite as admin for the event.",
    rejectInviteAsAdmin: "Error rejecting invite as admin for the event.",
    acceptInviteAsTeamMember:
      "Error accepting invite as team member for the event.",
    rejectInviteAsTeamMember:
      "Error rejecting invite as team member for the event.",
    acceptInviteAsSpeaker: "Error accepting invite as speaker for the event.",
    rejectInviteAsSpeaker: "Error rejecting invite as speaker for the event.",
    acceptInviteAsResponsibleOrganization:
      "Error accepting invite as responsible organization for the event.",
    rejectInviteAsResponsibleOrganization:
      "Error rejecting invite as responsible organization for the event.",
  },
  success: {
    acceptInviteAsAdmin: "Invite accepted as admin for the event.",
    rejectInviteAsAdmin: "Invite rejected as admin for the event.",
    acceptInviteAsTeamMember: "Invite accepted as team member for the event.",
    rejectInviteAsTeamMember: "Invite rejected as team member for the event.",
    acceptInviteAsSpeaker: "Invite accepted as speaker for the event.",
    rejectInviteAsSpeaker: "Invite rejected as speaker for the event.",
    acceptInviteAsResponsibleOrganization:
      "Invite accepted as responsible organization for the event.",
    rejectInviteAsResponsibleOrganization:
      "Invite rejected as responsible organization for the event.",
  },
  mail: {
    inviteAsAdminAccepted: {
      subject: "Die Einladung zum Admin eines Events wurde angenommen",
    },
    inviteAsAdminRejected: {
      subject: "Die Einladung zum Admin eines Events wurde abgelehnt",
    },
    inviteAsTeamMemberAccepted: {
      subject: "Die Einladung zum Teammitglied eines Events wurde angenommen",
    },
    inviteAsTeamMemberRejected: {
      subject: "Die Einladung zum Teammitglied eines Events wurde abgelehnt",
    },
    inviteAsSpeakerAccepted: {
      subject: "Die Einladung als Speaker:in eines Events wurde angenommen",
    },
    inviteAsSpeakerRejected: {
      subject: "Die Einladung als Speaker:in eines Events wurde abgelehnt",
    },
    inviteAsResponsibleOrganizationAccepted: {
      subject:
        "Die Einladung als verantwortliche Organisation eines Events wurde angenommen",
    },
    inviteAsResponsibleOrganizationRejected: {
      subject:
        "Die Einladung als verantwortliche Organisation eines Events wurde abgelehnt",
    },
  },
} as const;
