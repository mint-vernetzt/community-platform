export const locale = {
  explanation:
    "Once you cancel the event, all registered participants will automatically receive an email with the cancellation information.",
  hint: {
    explanation:
      "Your event is already published. You have the option to cancel your event. After that, you will also be able to delete it here.",
    childEvents:
      "Your event has sub-events. If you cancel it, participants, speakers, team members, and admins of your event and the sub-events will be informed about the cancellation.",
  },
  cancel: "Cancel event",
  confirmation: {
    cancelOnlyThis: {
      title: "Do you really want to cancel {{eventName}}?",
      description: "This action cannot be undone. ",
      confirm: "Cancel event",
      abort: "Abort",
    },
    cancelAll: {
      title: "Cancel {{eventName}} and all linked sub-events?",
      description:
        "Your event and the associated sub-events will be irrevocably cancelled. ",
      confirm: "Cancel events",
      abort: "Abort",
    },
  },
  success: "The event has been cancelled.",
  errors: {
    cancelFailed:
      "An error occurred while cancelling the event. Please try again.",
  },
  childEventsList: {
    waitinglist: "Waiting list seats",
    seatsFree: "Seats free",
    unlimitedSeats: "Unlimited seats",
    more: "Show more",
    less: "Show less",
    hint_singular: "Your event has one sub-event.",
    hint_plural: "Your event has {{count}} sub-events.",
  },
  handlingChildEvents: {
    description: "Decide how you want to handle the sub-events.",
    cancelOnlyThis: {
      headline: "Cancel only main event",
      description:
        "The main event will be cancelled, the sub-events will remain as independent events.",
    },
    cancelAll: {
      headline: "Cancel main event with my sub-events",
      description:
        "Both the main event and all associated sub-events that I administer will be cancelled.",
    },
  },
} as const;
