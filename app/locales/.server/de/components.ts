export const locale = {
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
    title: "Du hast ungespeicherte Änderungen",
    description:
      "Deine ungespeicherten Änderungen gehen verloren, wenn Du sie nicht speicherst, bevor Du zur nächsten Seite wechselst.",
    proceed: "Änderungen verwerfen",
    cancel: "Zurück zur Bearbeitung",
  },
  VisibilityCheckbox: {
    ariaLabel:
      "Sichtbarkeit auf privat oder öffentlich setzen. Haken gesetzt bedeutet öffentlich.",
  },
  Map: {
    webGLNotSupported: {
      stackError: "WebGL wird von Deinem Browser nicht unterstützt.",
      headline: "Hinweis: Karte kann nicht angezeigt werden",
      subline:
        "Es tut uns leid – die Karte kann in Deinem Browser gerade nicht angezeigt werden. Dafür wird WebGL benötigt, eine Technologie zur Darstellung von interaktiven Grafiken im Browser. So kannst Du das Problem möglicherweise beheben:",
      hints: [
        "Lade die Seite neu oder nutze einen anderen Browser.",
        "Stelle sicher, dass Dein Browser aktuell ist.",
        "Schließe Programme oder Tabs, die viel Rechenleistung brauchen.",
        "Aktiviere WebGL in den Browser-Einstellungen.",
        "Prüfe, ob Dein Grafiktreiber aktuell ist.",
        "Aktiviere die Hardwarebeschleunigung in Browser und Betriebssystem.",
        "Starte Dein Gerät neu oder versuche es auf einem anderen Gerät.",
      ],
      greetings:
        "Wenn Du weiterhin Probleme hast, melde Dich gerne bei uns. Wir unterstützen Dich gerne!",
    },
    organizationCountHeadline: "Organisationen und Netzwerke",
    openMenu: "Organisationsliste öffnen",
    closeMenu: "Organisationsliste schließen",
    organizationCardCta: "Organisation ansehen",
    toThePlatform: "Zur MINTvernetzt-Community-Plattform",
    whatIsShown_singular:
      "Ausschließlich <0>{{organizationsCount}}</0> Organisation, die eine Adresse angegeben hat, wird auf der Karte dargestellt. Hast Du weitere Fragen zur Karte? <1>Hier geht’s zum Hilfebereich</1>.",
    whatIsShown_plural:
      "Ausschließlich <0>{{organizationsCount}}</0> Organisationen, die eine Adresse angegeben haben, werden auf der Karte dargestellt. Hast Du weitere Fragen zur Karte? <1>Hier geht’s zum Hilfebereich</1>.",
    popupMultipleOrganizationsTitle: "Organisationen",
  },
} as const;
