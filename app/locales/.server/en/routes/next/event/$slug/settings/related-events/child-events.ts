export const locale = {
  current: {
    headline: "Current Child Events",
    cta: "Remove as Child Event",
  },
  addOrCreate: {
    headline: "Add Child Events",
    subline:
      "You can add more events to your event – these will then be managed as child events. Your original event will become the parent event. A parent event can contain multiple child events.",
    timePeriodHint:
      "Child events must be within the timeframe of the parent event and must not be published yet.",
    hasParentEventHint:
      "Your event is already a child event of a parent event. Therefore, it is not possible to add child events. Remove the event from the parent event to make it a parent event and add child events to it.",
    add: {
      label: "Add your own events as child events",
      cta: "Add as Child Event",
    },
  },
} as const;
