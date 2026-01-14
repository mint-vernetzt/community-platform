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
    title: "You have unsaved changes",
    description:
      "Your unsaved changes will be lost if you do not save them before navigating to the next page.",
    proceed: "Discard changes",
    cancel: "Back to editing",
  },
  VisibilityCheckbox: {
    ariaLabel: "Set visibility to private or public. Checkmark means public.",
  },
  Map: {
    webGLNotSupported: {
      stackError: "WebGL is not supported by your browser.",
      headline: "Note: Map cannot be displayed",
      subline:
        "We're sorry – the map cannot be displayed in your browser at the moment. WebGL is required for this, a technology for rendering interactive graphics in the browser. Here are some possible solutions:",
      hints: [
        "Reload the page or use a different browser.",
        "Make sure your browser is up to date.",
        "Close programs or tabs that are using a lot of processing power.",
        "Enable WebGL in your browser settings.",
        "Check if your graphics driver is up to date.",
        "Enable hardware acceleration in your browser and operating system.",
        "Restart your device or try a different device.",
      ],
      greetings:
        "If you continue to have problems, please feel free to contact us. We are happy to help!",
    },
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
