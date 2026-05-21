export const locale = {
  current: {
    headline: "Current Child Events",
    cta: "Remove as Child Event",
  },
  addOrCreate: {
    headline: "Add Child Events",
    hasParentEventHint:
      "Your event is already a child event of a parent event. Therefore, it is not possible to add child events. Remove the event from the parent event to make it a parent event and add child events to it.",
    subline:
      "You can add more events to your event – these will then be managed as child events. Your original event will become the parent event. A parent event can contain multiple child events.",
    timePeriodHint:
      "Child events must be within the timeframe of the parent event and must not be published yet.",
    blankStateHint:
      "There are currently no child events that you can add. First, create an event within the appropriate timeframe and add it as a child event.",
    add: {
      label: "Add your own events as child events",
      cta: "Add as Child Event",
    },
  },
  list: {
    more: "{{count}} more",
    less: "{{count}} less",
    waitinglist: "Waiting list spots",
    seatsFree: "Seats available",
    unlimitedSeats: "Unlimited seats",
    draft: "Draft",
    canceled: "Canceled",
    alreadyPublished: "already published",
    alreadyAdded: "already added as a child event",
    hasChildEvents: "already has child events",
    hasDifferentParent: "has a different parent event",
  },
  errors: {
    addChildEvent:
      "The child event could not be added. Please try again later.",
    removeChildEvent:
      "The child event could not be removed. Please try again later.",
  },
  success: {
    addChildEvent: "The child event was successfully added.",
    removeChildEvent: "The child event was successfully removed.",
  },
} as const;
