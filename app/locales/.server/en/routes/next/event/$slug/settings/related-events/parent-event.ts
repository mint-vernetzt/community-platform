export const locale = {
  addOrRequest: {
    headline: "Add Parent Event",
    hasChildEventsHint:
      "Your event is already set as a parent event. Therefore, you cannot assign it to another parent event. If you want to make your event a sub-event of an existing parent event, first remove the sub-events from your current event. Then you can assign it to a parent event.",
    subline:
      "You can assign an existing parent event to your event. This will make your event a sub-event.",
    timePeriodHint:
      "The parent event must be completely within the time period of your sub-event.",
    label: "Add an event as a parent event",
    cta: { add: "Assign as parent event", request: "Request to add" },
    requestConfirmation: {
      title: "Request to add",
      description:
        "Once your request is confirmed, the admins of the parent event will automatically gain admin rights for your event, as the admins are responsible for the overall management of the parent event and its associated events.",
      confirm: "Request",
      abort: "Cancel",
    },
    blankStateHint:
      "There is currently no parent event that you can add. Please create an event in the corresponding time period first and then add your sub-event to it.",
    publishedHint:
      "Since your event has already been published, you cannot make any changes to the link to the parent event.",
  },
  pending: {
    headline: "Pending Request",
    subline:
      "An admin of the parent event must still confirm that your event will be added as a sub-event.",
    pendingRequestHint:
      "Since you have already requested a parent event, you cannot link another event as a parent event. If you want to add another event instead, first withdraw your existing request.",
    notificationHint:
      "If you withdraw your request, an admin of the parent event will be informed.",
    cta: "Withdraw request",
  },
  current: {
    headline: "Current Parent Event",
    cta: "Remove as parent event",
    hint: {
      unpublishedSameAdmin:
        "If you remove the link to the parent event, your event will become an independent event again.",
      unpublishedDifferentAdmin:
        "If you remove the link to the parent event, your event will become an independent event again. The admin of the parent event will be informed about the dissolved link.",
      publishedSameAdmin:
        "If you remove the link to the parent event, your event will become an independent event again. Since your event has already been published, the parent event cannot be re-added after removal.",
      publishedDifferentAdmin:
        "If you remove the link to the parent event, your event will become an independent event again. The admin of the parent event will be informed about the dissolved link. Since your event has already been published, the parent event cannot be re-added after removal.",
    },
    removeConfirmation: {
      title: "Remove Parent Event",
      description:
        "Since your event has already been published, the parent event cannot be re-added after removal. If you remove the parent event, your event will become an independent event again.",
      confirm: "Remove anyway",
      abort: "Cancel",
    },
  },
  list: {
    more: "{{count}} more",
    less: "{{count}} less",
    waitinglist: "Waiting list spots",
    seatsFree: "Seats available",
    unlimitedSeats: "Unlimited seats",
    hasParentEvent: "already has a parent event",
  },
  errors: {
    addParentEvent:
      "The parent event could not be added. Please try again later.",
    removeParentEvent:
      "The parent event could not be removed. Please try again later.",
    requestToJoinParentEvent:
      "The request to add the parent event could not be sent. Please try again later.",
    cancelParentEventJoinRequest:
      "The request to add the parent event could not be withdrawn. Please try again later.",
  },
  success: {
    addParentEvent: "The parent event was successfully added.",
    removeParentEvent: "The parent event was successfully removed.",
    requestToJoinParentEvent:
      "The request to add the parent event was successfully sent.",
    cancelParentEventJoinRequest:
      "The request to add the parent event was successfully withdrawn.",
  },
  mail: {
    request: {
      buttonText: "Zur Community Plattform",
      subject:
        "Dein Event wurde als Unterveranstaltung zu einem Rahmenevent angefragt",
    },
    cancel: {
      buttonText: "Zur Community Plattform",
      subject:
        "Die Anfrage eines Events, Teil deines Events zu werden, wurde zurückgezogen",
    },
    remove: {
      subject: "Ein Event wurde aus deinem Rahmenevent entfernt",
    },
  },
} as const;
