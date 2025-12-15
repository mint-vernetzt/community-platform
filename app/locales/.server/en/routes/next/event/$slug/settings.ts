export const locale = {
  mobileHeadline: "Settings",
  desktopHeadline: "Edit Event",
  close: "Back to Event",
  back: "Back to Menu",
  publishHint: "Your event is not publicly visible while in draft mode.",
  publishCta: "Publish event",
  menu: {
    admins: "Administrators",
    dangerZone: "Danger Zone",
    details: "Event Details",
    documents: "Manage documents",
    location: "Location and accessibility",
    participants: "Participants",
    registration: "Registration",
    relatedEvents: "Related events",
    responsibleOrgs: "Responsible organizations",
    speakers: "Speakers",
    team: "Team",
    timePeriod: "Date and time",
  },
  errors: {
    invalidIntent: "This action is not allowed",
    publishFailed:
      "Publishing the event failed. Please try again later or contact support.",
  },
  publishSuccess: "Event published!",
} as const;
