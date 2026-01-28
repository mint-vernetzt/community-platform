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
    speakerEvents: "Speaker",
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
  },
  success: {
    acceptInviteAsAdmin: "Invite accepted as admin for the event.",
    rejectInviteAsAdmin: "Invite rejected as admin for the event.",
  },
} as const;
