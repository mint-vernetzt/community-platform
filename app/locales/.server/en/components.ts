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
      "Your browser does not currently support WebGL, which is required to display the map. It may help to reload the page or use a different browser. Here are some other options that might help:\n- Make sure your browser is up to date.\n- Check your GPU usage and close any programs or tabs that are using a lot of power.\n - Check your browser's graphics settings and enable WebGL if it is disabled.\n - Check that you have the latest graphics driver installed.\n - Check that hardware acceleration is enabled in your browser settings and on your operating system.\n - If necessary, try a different browser or device, or restart your device.",
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
