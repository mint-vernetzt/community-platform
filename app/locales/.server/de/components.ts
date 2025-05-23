export const locale = {
  EventListItem: {},
  EventListItemContent: {
    onWaitingList: "auf der Warteliste",
    unlimitedSeats: "Unbegrenzte Plätze",
    seatsFree: "Plätzen frei",
  },
  EventListItemFlag: {
    canceled: "Abgesagt",
    draft: "Entwurf",
  },
  ListContainer: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
  },
  UnsavedChangesModal: {
    title: "Ungespeicherte Änderungen",
    description:
      "Du hast ungespeicherte Änderungen. Diese gehen verloren, wenn Du jetzt einen Schritt weiter gehst.",
    proceed: "Änderungen verwerfen",
    cancel: "Abbrechen",
  },
  VisibilityCheckbox: {
    ariaLabel:
      "Sichtbarkeit auf privat oder öffentlich setzen. Haken gesetzt bedeutet öffentlich.",
  },
} as const;
