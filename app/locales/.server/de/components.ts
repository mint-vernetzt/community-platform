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
  Map: {
    webGLNotSupported:
      "Dein Browser unterstützt aktuell kein WebGL, was für die Kartenanzeige erforderlich ist. Eventuell hilft es die Seite neu zu laden oder einen anderen Browser zu verwenden. Hier sind weitere Optionen die helfen könnten:\n- Stelle sicher, dass Dein Browser auf dem neuesten Stand ist.\n- Überprüfe deine GPU-Auslastung und beende Programme oder schließe Tabs, die viel Leistung beanspruchen.\n- Überprüfe die Grafikeinstellungen Deines Browsers und aktiviere WebGL, falls es deaktiviert ist.\n- Überprüfe, ob Du den aktuellsten Grafiktreiber installiert hast.\n- Überprüfe ob die Hardwarebeschleunigung in den Browsereinstellungen und auf deinem Betriebssystem aktiviert ist.\n- Versuche es gegebenenfalls mit einem anderen Browser oder Gerät oder starte dein Gerät neu.",
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
