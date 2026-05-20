export const locale = {
  headline: "Add Parent Event",
  subline:
    "You can assign an existing parent event to your event. This will make your event a sub-event.",
  timePeriodHint:
    "The parent event must be completely within the time period of your sub-event.",
  add: {
    label: "Add an event as a parent event",
    cta: "Assign as parent event",
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
  },
  success: {
    addParentEvent: "The parent event was successfully added.",
  },
} as const;
