export const locale = {
  current: {
    headline: "Current sub-events",
    cta: "Remove as sub-event",
    removeConfirmation: {
      title: "Remove sub-event",
      description:
        "The sub-event is already published. If you remove the sub-event, it will become an independent event again. The sub-event cannot be added as a sub-event again after removal.",
      confirm: "Remove Anyway",
      abort: "Cancel",
    },
  },
  addOrCreate: {
    headline: "Add sub-events",
    hasParentEventHint:
      "Your event is already a sub-event of a main event. Therefore, it is not possible to add sub-events. Remove the event from the main event to make it a main event and add sub-events to it.",
    hasPendingRequestHint:
      "You have already requested to add your event as a sub-event to a main event. While this request is pending, you cannot add another event as a sub-event. If you want to add a different event instead, first withdraw your existing request.",
    subline:
      "You can add more events to your event – these will then be managed as sub-events. Your original event will become the main event. A main event can contain multiple sub-events.",
    timePeriodHint:
      "Sub-events must be within the timeframe of the main event and must not be published yet.",
    blankStateHint:
      "There are currently no sub-events that you can add. First, create an event within the appropriate timeframe and add it as a sub-event.",
    add: {
      label: "Add your own events as sub-events",
      cta: "Add new sub-event",
    },
    create: {
      label: "Create a sub-event",
      cta: "Create new sub-event",
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
    alreadyAdded: "already added as a sub-event",
    hasChildEvents: "already has sub-events",
    hasDifferentParent: "has a different main event",
    outOfTimeframe: "not within the appropriate timeframe",
  },
  errors: {
    addChildEvent: "The sub-event could not be added. Please try again later.",
    removeChildEvent:
      "The sub-event could not be removed. Please try again later.",
  },
  success: {
    addChildEvent: "The sub-event was successfully added.",
    removeChildEvent: "The sub-event was successfully removed.",
  },
} as const;
