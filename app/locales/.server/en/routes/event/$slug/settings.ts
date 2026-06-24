export const locale = {
  mobileHeadline: "Settings",
  desktopHeadline: "Edit Event",
  close: "Back to Event",
  back: "Back to Menu",
  publishHint: "Your event is not publicly visible while in draft mode.",
  publishCta: "Publish event",
  parentEventNotPublishedHint:
    "Your event is part of a parent event. You must publish the parent event first.",
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
  menuHints: {
    participantsDisabledUntilPublished:
      "Once your event is published, you can manage your participants here.",
    inviteParticipants: "Invite participants",
    waitingListHasMembers: "People on the waiting list",
    externalEvent: "This event is managed externally",
    multiple: "Add information",
  },
  errors: {
    invalidIntent: "This action is not allowed",
    publishFailed:
      "Publishing the event failed. Please try again later or contact support.",
  },
  publishSuccess: "Event published!",
  modal: {
    publishEventModal: {
      withIssues: {
        headline: "Completing your event is recommended",
        description:
          "Your event can be published, but we recommend adding the following information in the settings beforehand:",
        submit: "Publish anyway",
        cancel: "Back to settings",
      },
      noIssues: {
        headline: "Publish event",
        description: "Great! Your event is complete and ready to be published.",
        submit: "Publish now",
        cancel: "Cancel",
      },
      hint: {
        description:
          "<0>Note</0>: After publishing, your event will be visible to users and cannot be set back to draft. If necessary, you can still cancel and delete the event later.",
      },
    },
  },
  issues: {
    registration: {
      missingExternalRegistrationUrl: "Add external registration link",
    },
    details: {
      missingDescriptionAndSubline: "Add short info and description",
      missingKeywordsAndTags: "Add keywords / tags",
      missingBackgroundImage: "Add a cover image",
    },
    location: {
      missingAddress: "No address provided",
      missingConferenceLink: "No conference link provided",
      missingAddressAndConferenceLink:
        "Address and conference link are missing",
    },
  },
} as const;
