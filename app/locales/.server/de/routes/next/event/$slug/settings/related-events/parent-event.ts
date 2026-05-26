export const locale = {
  addOrRequest: {
    headline: "Rahmenveranstaltung hinzufügen",
    hasChildEventsHint:
      "Dein Event ist bereits als Rahmenveranstaltung angelegt. Daher kannst Du es nicht zusätzlich einem anderen Rahmenevent zuordnen. Wenn Du Dein Event stattdessen als Unterveranstaltung eines bestehenden Rahmenevents anlegen möchtest, entferne zuerst die Unterevents aus Deinem aktuellen Event. Danach kannst Du es einem Rahmenevent zuordnen.",
    subline:
      "Du kannst Deinem Event eine bestehende Rahmenveranstaltung zuordnen. Dadurch wird Dein Event zur Unterveranstaltung.",
    timePeriodHint:
      "Die Rahmenveranstaltung muss zeitlich vollständig innerhalb des Zeitraums Deines Unterevents liegen.",
    label: "Füge ein Event als Rahmenevent hinzu",
    cta: { add: "Als Rahmenevent zuweisen", request: "Hinzufügen anfragen" },
    blankStateHint:
      "Es gibt aktuell kein Rahmenevent, das Du hinzufügen kannst. Erstelle zunächst ein Event im entsprechenden Zeitraum und füge diesem Dein untergeordnetes Event hinzu.",
  },
  pending: {
    headline: "Ausstehende Anfrage",
    subline:
      "Ein Admin der Rahmenveranstaltung muss noch be-stätigen, dass Dein Event als Unterevent hinzugefügt wird.",
    pendingRequestHint:
      "Da Du bereits bei einem Event als Rahmenevent an-gefragt hast, kannst Du kein anderes Event als Rah-menveranstaltung verknüpfen. Wenn Du stattdes-sen ein anderes Event hinzufügen möchtest, ziehe  zuerst Deine bestehende Anfrage zurück.",
    notficationHint:
      "Wenn Du Deine Anfrage zurückziehst, wird ein Ad-min der Rahmenveranstaltung darüber informiert.",
    cta: "Anfrage zurückziehen",
  },
  current: {
    headline: "Aktuelles Rahmenevent",
    cta: "Als Rahmenevent entfernen",
    hint: {
      unpublishedSameAdmin:
        "Solltest Du die Verknüpfung zum Rahmenevent entfernen, wird Dein Event wieder zur eigenständigen Veranstaltung. Eine Auflösung der Verknüpfung ist nur möglich, solange Dein Event noch nicht veröffentlicht ist.",
      unpublishedDifferentAdmin:
        "Solltest Du die Verknüpfung zum Rahmenevent entfernen, wird Dein Event wieder zur eigenständigen Veranstaltung. Der Admin des Rahmenevents wird über die aufgelöste Verknüpfung informiert. Eine Auflösung der Verknüpfung ist nur möglich, solange Dein Event noch nicht veröffentlicht ist.",
      published:
        "Da Dein Event bereits veröffentlicht ist, kannst Du keine Anpassung in der Verknüpfung zur Rahmenveranstaltung mehr vornehmen.",
    },
  },
  list: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    waitinglist: "Wartelistenplätze",
    seatsFree: "Plätzen frei",
    unlimitedSeats: "Unbegrenzte Plätze",
    hasParentEvent: "hat selbst ein Rahmenevent",
  },
  errors: {
    addParentEvent:
      "Die Rahmenveranstaltung konnte nicht hinzugefügt werden. Bitte versuche es später erneut.",
    removeParentEvent:
      "Die Rahmenveranstaltung konnte nicht entfernt werden. Bitte versuche es später erneut.",
    requestToJoinParentEvent:
      "Die Anfrage zum Hinzufügen der Rahmenveranstaltung konnte nicht gesendet werden. Bitte versuche es später erneut.",
    cancelParentEventJoinRequest:
      "Die Anfrage zum Hinzufügen der Rahmenveranstaltung konnte nicht zurückgezogen werden. Bitte versuche es später erneut.",
  },
  success: {
    addParentEvent: "Die Rahmenveranstaltung wurde erfolgreich hinzugefügt.",
    removeParentEvent: "Die Rahmenveranstaltung wurde erfolgreich entfernt.",
    requestToJoinParentEvent:
      "Die Anfrage zum Hinzufügen der Rahmenveranstaltung wurde erfolgreich gesendet.",
    cancelParentEventJoinRequest:
      "Die Anfrage zum Hinzufügen der Rahmenveranstaltung wurde erfolgreich zurückgezogen.",
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
