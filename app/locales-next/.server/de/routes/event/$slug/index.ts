export const locale = {
  error: {
    notFound: "Event not found",
    notPublished: "Event not published",
  },
  success: {
    abuseReport: "Die Meldung der Veranstaltung wurde verschickt.",
  },
  content: {
    report: "Veranstaltung melden",
    clock: "{{date}}, {{time}} Uhr",
    backgroundImage: "Aktuelles Hintergrundbild",
    borderOfImage: "Rahmen des Hintergrundbildes",
    back: "Veranstaltungen entdecken",
    change: "Hintergrund ändern",
    headline: "Hintergrundbild",
    event: {
      cancelled: "Abgesagt",
      published: "Veröffentlicht",
      draft: "Entwurf",
      alreadyTakenPlace: "Veranstaltung hat bereits stattgefunden.",
      registrationNotStarted: "Anmeldefrist hat noch nicht begonnen.",
      registrationExpired: "Anmeldefrist ist bereits abgelaufen.",
      context: "Diese Veranstaltung findet im Rahmen von <0>{{name}}</0> statt",
      loginToRegister: "Anmelden um teilzunehmen",
      select:
        "Wähle <0>zugehörige Veranstaltungen</0> aus, an denen Du teilnehmen möchtest.",
      edit: "Veranstaltung bearbeiten",
      createRelated: "Zugehörige Veranstaltungen anlegen",
      type: "Veranstaltungsart",
      location: "Veranstaltungsort",
      conferenceLink: "Konferenzlink",
      conferenceCode: "Konferenz-Code",
      start: "Start",
      end: "Ende",
      registrationStart: "Registrierungsbeginn",
      registrationEnd: "Registrierungsende",
      numberOfPlaces: "Verfügbare Plätze",
      withoutRestriction: "ohne Beschränkung",
      numberOfWaitingSeats: "Wartelistenplätze",
      onWaitingList: "auf der Warteliste",
      calenderItem: "Kalender-Eintrag",
      download: "Download",
      downloads: "Downloads",
      downloadAll: "Alle Herunterladen",
      focusAreas: "Schwerpunkte",
      targetGroups: "Zielgruppe",
      experienceLevel: "Erfahrunsglevel",
      tags: "Tags",
      areas: "Gebiete",
      speakers: "Speaker:innen",
      organizedBy: "Veranstaltet von",
      participants: "Teilnehmer:innen",
      more: "Mehr erfahren",
      register: "Anmelden",
      waiting: "wartend",
      registered: "Angemeldet",
      waitingList: "{{count}} auf der Warteliste",
      unlimitedSeats: " | Unbegrenzte Plätze",
      seatsFree: " | {{count}} / {{total}} Plätzen frei",
      relatedEvents: "Zugehörige Veranstaltungen",
      eventContext:
        'Diese Veranstaltungen finden im Rahmen von "{{name}}" statt.',
      team: "Team",
    },
  },
  abuseReport: {
    title: "Warum möchstest Du dieses Event melden?",
    description:
      "Um Deiner Meldung nachgehen zu  können, benötigen wir den Grund, warum Du dieses Event melden möchtest.",
    otherReason: "Anderer Grund",
    noReasons: "Bitte gib mindestens einen Grund an.",
    submit: "Event melden",
    abort: "Abbrechen",
  },
} as const;
