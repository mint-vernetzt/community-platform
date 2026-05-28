export const locale = {
  current: {
    headline: "Aktuelle Unterevents",
    cta: "Als Unterevent entfernen",
    removeConfirmation: {
      title: "Unterevent entfernen",
      description:
        "Das Unterevent ist bereits veröffentlicht. Wenn Du das Unterevent entfernst, wird es wieder zu einem eigenständigen Event. Das Unterevent kann nach dem Entfernen nicht erneut als Unterevent hinzugefügt werden.",
      confirm: "Trotzdem entfernen",
      abort: "Abbrechen",
    },
  },
  addOrCreate: {
    headline: "Unterevents hinzufügen",
    hasParentEventHint:
      "Dein Event ist bereits ein Unterevent einer Rahmenveranstaltung. Daher ist es nicht möglich, Unterveranstaltungen hinzuzufügen. Löse das Event aus dem Rahmenevent heraus, um es selbst zum Rahmenevent zu machen und ihm Unterveranstaltungen hinzuzufügen.",
    hasPendingRequestHint:
      "Du hast bereits eine Anfrage gestellt, um Dein Event als Unterevent zu einem Rahmenevent hinzuzufügen. Solange diese Anfrage noch aussteht, kannst Du kein anderes Event als Unterevent hinzufügen. Wenn Du stattdessen ein anderes Event hinzufügen möchtest, ziehe zuerst Deine bestehende Anfrage zurück.",
    subline:
      "Du kannst zu Deinem Event weitere Veranstaltungen hinzufügen – diese werden dann als Unterveranstaltungen geführt. Dein ursprüngliches Event wird dadurch zur Rahmenveranstaltung. Eine Rahmenveranstaltung kann mehrere Unterveranstaltungen enthalten.",
    timePeriodHint:
      "Unterveranstaltungen müssen im Zeitraum der Rahmenveranstaltung liegen und dürfen noch nicht veröffentlich sein.",
    blankStateHint:
      "Es gibt aktuell keine Unterveranstaltungen, die Du hinzufügen kannst. Erstelle zunächst ein Event im entsprechenden Zeitraum und füge dieses als untergeordnetes Event hinzu.",
    add: {
      label: "Eigene Events als untergeordnete Veranstaltungen hinzufügen",
      cta: "Als Unterevent hinzufügen",
    },
  },
  list: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    waitinglist: "Wartelistenplätze",
    seatsFree: "Plätzen frei",
    unlimitedSeats: "Unbegrenzte Plätze",
    draft: "Entwurf",
    canceled: "Abgesagt",
    alreadyPublished: "bereits veröffentlicht",
    alreadyAdded: "bereits als Unterevent hinzugefügt",
    hasChildEvents: "hat selbst Unterevents",
    hasDifferentParent: "hat ein anderes Rahmenevent",
    outOfTimeframe: "nicht im entsprechenden Zeitraum",
  },
  errors: {
    addChildEvent:
      "Das Unterevent konnte nicht hinzugefügt werden. Bitte versuche es später erneut.",
    removeChildEvent:
      "Das Unterevent konnte nicht entfernt werden. Bitte versuche es später erneut.",
  },
  success: {
    addChildEvent: "Das Unterevent wurde erfolgreich hinzugefügt.",
    removeChildEvent: "Das Unterevent wurde erfolgreich entfernt.",
  },
} as const;
