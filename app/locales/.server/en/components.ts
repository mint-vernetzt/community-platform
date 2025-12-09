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
    webGLNotSupported:
      "Your browser does not support WebGL, which is required for displaying the map. Reloading the page or using a different browser might help.",
    organizationCountHeadline: "organizations and networks",
    openMenu: "Open organization list",
    closeMenu: "Close organization list",
    organizationCardCta: "View organization",
    toThePlatform: "To the MINTvernetzt community platform",
    whatIsShown_singular:
      "Only <0>{{organizationsCount}}</0> organization that has provided an address is displayed on the map. Do you have further questions about the map? <1>Here’s the help section</1>.",
    whatIsShown_plural:
      "Only <0>{{organizationsCount}}</0> organizations that have provided an address are displayed on the map. Do you have further questions about the map? <1>Here’s the help section</1>.",
    popupMultipleOrganizationsTitle: "organizations",
  },
} as const;
