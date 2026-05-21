export const locale = {
  add: {
    headline: "Rahmenveranstaltung hinzufügen",
    hasChildEventsHint:
      "Dein Event ist bereits als Rahmenveranstaltung angelegt. Daher kannst Du es nicht zusätzlich einem anderen Rahmenevent zuordnen. Wenn Du Dein Event stattdessen als Unterveranstaltung eines bestehenden Rahmenevents anlegen möchtest, entferne zuerst die Unterevents aus Deinem aktuellen Event. Danach kannst Du es einem Rahmenevent zuordnen.",
    subline:
      "Du kannst Deinem Event eine bestehende Rahmenveranstaltung zuordnen. Dadurch wird Dein Event zur Unterveranstaltung.",
    timePeriodHint:
      "Die Rahmenveranstaltung muss zeitlich vollständig innerhalb des Zeitraums Deines Unterevents liegen.",
    label: "Füge ein Event als Rahmenevent hinzu",
    cta: "Als Rahmenevent zuweisen",
    blankStateHint:
      "Es gibt aktuell kein Rahmenevent, das Du hinzufügen kannst. Erstelle zunächst ein Event im entsprechenden Zeitraum und füge diesem Dein untergeordnetes Event hinzu.",
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
    hasParentEvent: "Hat selbst ein Rahmenevent",
  },
  errors: {
    addParentEvent:
      "Die Rahmenveranstaltung konnte nicht hinzugefügt werden. Bitte versuche es später erneut.",
    removeParentEvent:
      "Die Rahmenveranstaltung konnte nicht entfernt werden. Bitte versuche es später erneut.",
  },
  success: {
    addParentEvent: "Die Rahmenveranstaltung wurde erfolgreich hinzugefügt.",
    removeParentEvent: "Die Rahmenveranstaltung wurde erfolgreich entfernt.",
  },
} as const;
