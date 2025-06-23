export const locale = {
  EventListItem: {},
  EventListItemContent: {
    onWaitingList: "on waiting list",
    unlimitedSeats: "Unlimited seats",
    seatsFree: "seats free",
  },
  EventListItemFlag: {
    canceled: "Canceled",
    draft: "Draft",
  },
  ListContainer: {
    more: "Show {{count}} more",
    less: "Show {{count}} less",
  },
  UnsavedChangesModal: {
    title: "Unsaved changes",
    description:
      "You have unsaved changes. These will be lost if you go one step further now.",
    proceed: "Discard changes",
    cancel: "Cancel",
  },
  VisibilityCheckbox: {
    ariaLabel: "Set visibility to private or public. Checkmark means public.",
  },
  BreadCrump: {
    prefix: "Back to ...",
  },
} as const;
