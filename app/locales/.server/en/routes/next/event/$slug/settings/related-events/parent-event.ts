export const locale = {
  add: {
    headline: "Add Parent Event",
    subline:
      "You can assign an existing parent event to your event. This will make your event a sub-event.",
    timePeriodHint:
      "The parent event must be completely within the time period of your sub-event.",
    label: "Add an event as a parent event",
    cta: "Assign as parent event",
    blankStateHint:
      "There is currently no parent event that you can add. Please create an event in the corresponding time period first and then add your sub-event to it.",
  },
  current: {
    headline: "Current Parent Event",
    cta: "Remove as parent event",
    hint: {
      unpublishedSameAdmin:
        "If you remove the link to the parent event, your event will become an independent event again. The link can only be removed as long as your event has not been published yet.",
      unpublishedDifferentAdmin:
        "If you remove the link to the parent event, your event will become an independent event again. The admin of the parent event will be informed about the dissolved link. The link can only be removed as long as your event has not been published yet.",
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
