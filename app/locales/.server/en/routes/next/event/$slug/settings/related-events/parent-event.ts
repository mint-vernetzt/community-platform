export const locale = {
  add: {
    headline: "Add Parent Event",
    subline:
      "You can assign an existing parent event to your event. This will make your event a sub-event.",
    timePeriodHint:
      "The parent event must be completely within the time period of your sub-event.",
    label: "Add an event as a parent event",
    cta: "Assign as parent event",
  },
  current: {
    headline: "Current Parent Event",
    cta: "Remove as parent event",
    hint: {
      // TODO: Remove admin notification part if only own events can be assigned as parent events
      unpublished:
        "If you remove the link to the parent event, your event will become an independent event again. The admin of the parent event will be informed about the dissolved link. A link can only be dissolved as long as your event has not yet been published.",
      published:
        "Since your event has already been published, you can no longer make changes to the link to the parent event.",
    },
  },
  list: {
    more: "{{count}} more",
    less: "{{count}} less",
    waitinglist: "Waiting list",
    seatsFree: "Seats available",
    unlimitedSeats: "Unlimited seats",
  },
  errors: {
    addParentEvent:
      "The parent event could not be added. Please try again later.",
    removeParentEvent:
      "The parent event could not be removed. Please try again later.",
  },
  success: {
    addParentEvent: "The parent event was successfully added.",
    removeParentEvent: "The parent event was successfully removed.",
  },
} as const;
