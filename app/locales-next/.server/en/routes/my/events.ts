export const locale = {
  title: "My Events",
  create: "Create event",
  placeholder: {
    title: "You have not participated in any event yet.",
    description: "Explore events and get to know the community better.",
    cta: "Explore events",
  },
  canceled: {
    title_one: "Canceled Event",
    title_other: "Canceled Events",
    description_one: "An event you signed up for has been canceled.",
    description_other: "{{count}} events you signed up for have been canceled.",
  },
  upcoming: {
    title: "Upcoming Events",
  },
  past: {
    title: "Past Events",
  },
  tabBar: {
    adminEvents: "Admin",
    teamMemberEvents: "Team Member",
    speakerEvents: "Speaker",
    participantEvents: "Participant",
    waitingListEvents: "Waiting List",
  },
} as const;
