export const locale = {
  addOrRequest: {
    headline: "Rahmenveranstaltung hinzufügen",
    hasPendingRequestHint:
      "Du hast noch eine ausstehende Anfrage, selbst Rahmenevent zu werden. Sobald diese Anfrage bestätigt oder abgelehnt wurde, kannst Du eine neue Rahmenveranstaltung hinzufügen. <0>Zur Verknüpfungsanfrage</0>",
    hasChildEventsHint:
      "Dein Event ist bereits als Rahmenveranstaltung angelegt. Daher kannst Du es nicht zusätzlich einem anderen Rahmenevent zuordnen. Wenn Du Dein Event stattdessen als Unterveranstaltung eines bestehenden Rahmenevents anlegen möchtest, entferne zuerst die Unterevents aus Deinem aktuellen Event. Danach kannst Du es einem Rahmenevent zuordnen.",
    subline:
      "Du kannst Deinem Event eine bestehende Rahmenveranstaltung zuordnen. Dadurch wird Dein Event zur Unterveranstaltung.",
    timePeriodHint:
      "Die Rahmenveranstaltung muss zeitlich vollständig innerhalb des Zeitraums Deines Unterevents liegen.",
    label: "Füge ein Event als Rahmenevent hinzu",
    cta: { add: "Als Rahmenevent zuweisen", request: "Hinzufügen anfragen" },
    requestConfirmation: {
      title: "Hinzufügen anfragen",
      description:
        "Sobald Deine Anfrage bestätigt wird, erhalten die Adminpersonen der Rahmenveranstaltung automatisch auch Adminrechte für Dein Event, da die Admins die Gesamtverantwortung für die Rahmenveranstaltung und die zugehörigen Events tragen.",
      confirm: "Anfragen",
      abort: "Abbrechen",
    },
    blankStateHint:
      "Es gibt aktuell kein Rahmenevent, das Du hinzufügen kannst. Erstelle zunächst ein Event im entsprechenden Zeitraum und füge diesem Dein untergeordnetes Event hinzu.",
    publishedHint:
      "Da Dein Event bereits veröffentlicht ist, kannst Du keine Anpassung in der Verknüpfung zur Rahmenveranstaltung mehr vornehmen.",
  },
  pending: {
    headline: "Ausstehende Anfrage",
    subline:
      "Ein Admin der Rahmenveranstaltung muss noch bestätigen, dass Dein Event als Unterevent hinzugefügt wird.",
    pendingRequestHint:
      "Da Du bereits bei einem Event als Rahmenevent angefragt hast, kannst Du kein anderes Event als Rahmenveranstaltung verknüpfen. Wenn Du stattdessen ein anderes Event hinzufügen möchtest, ziehe  zuerst Deine bestehende Anfrage zurück.",
    notificationHint:
      "Wenn Du Deine Anfrage zurückziehst, wird ein Admin der Rahmenveranstaltung darüber informiert.",
    cta: "Anfrage zurückziehen",
  },
  current: {
    headline: "Aktuelles Rahmenevent",
    cta: "Als Rahmenevent entfernen",
    hint: {
      unpublishedSameAdmin:
        "Solltest Du die Verknüpfung zum Rahmenevent entfernen, wird Dein Event wieder zur eigenständigen Veranstaltung.",
      unpublishedDifferentAdmin:
        "Solltest Du die Verknüpfung zum Rahmenevent entfernen, wird Dein Event wieder zur eigenständigen Veranstaltung. Der Admin des Rahmenevents wird über die aufgelöste Verknüpfung informiert.",
      publishedSameAdmin:
        "Solltest Du die Verknüpfung zum Rahmenevent entfernen, wird Dein Event wieder zur eigenständigen Veranstaltung. Da Dein Event bereits veröffentlicht ist, kann nach dem Entfernen nicht erneut eine Rahmenveranstaltung hinzugefügt werden.",
      publishedDifferentAdmin:
        "Solltest Du die Verknüpfung zum Rahmenevent entfernen, wird Dein Event wieder zur eigenständigen Veranstaltung. Der Admin des Rahmenevents wird über die aufgelöste Verknüpfung informiert. Da Dein Event bereits veröffentlicht ist, kann nach dem Entfernen nicht erneut eine Rahmenveranstaltung hinzugefügt werden.",
    },
    removeConfirmation: {
      title: "Rahmenveranstaltung entfernen",
      description:
        "Da dein Event bereits veröffentlicht ist, kann die Rahmenveranstaltung nach dem Entfernen nicht wieder hinzugefügt werden. Wenn Du die Rahmenveranstaltung entfernst, wird Dein Event wieder zur eigenständigen Veranstaltung.",
      confirm: "Trotzdem entfernen",
      abort: "Abbrechen",
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
