export const locale = {
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
  Map: {
    organizationCountHeadline: "organizations and networks",
    openMenu: "Open organization list",
    closeMenu: "Close organization list",
    organizationCardCta: "View organization",
    toThePlatform: "To the MINTvernetzt community platform",
    whatIsShown:
      "On the map, only organizations that have provided their address are shown. If you have further questions about the map, <0>here is the help section</0>.",
  },
} as const;
