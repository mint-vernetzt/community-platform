export const locale = {
  headline: "Rahmenveranstaltung hinzufügen",
  subline:
    "Du kannst Deinem Event eine bestehende Rahmenveranstaltung zuordnen. Dadurch wird Dein Event zur Unterveranstaltung.",
  timePeriodHint:
    "Die Rahmenveranstaltung muss zeitlich vollständig innerhalb des Zeitraums Deines Unterevents liegen.",
  add: {
    label: "Füge ein Event als Rahmenevent hinzu",
    cta: "Als Rahmenevent zuweisen",
  },
  list: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    waitinglist: "Wartelistenplätze",
    seatsFree: "Plätzen frei",
    unlimitedSeats: "Unbegrenzte Plätze",
  },
  errors: {
    addParentEvent:
      "Die Rahmenveranstaltung konnte nicht hinzugefügt werden. Bitte versuche es später erneut.",
  },
  success: {
    addParentEvent: "Die Rahmenveranstaltung wurde erfolgreich hinzugefügt.",
  },
} as const;
