export const locale = {
  current: {
    headline: "Aktuelle Unterevents",
    cta: "Als Unterevent entfernen",
  },
  addOrCreate: {
    headline: "Unterevents hinzufügen",
    subline:
      "Du kannst zu Deinem Event weitere Veranstaltungen hinzufügen – diese werden dann als Unterveranstaltungen geführt. Dein ursprüngliches Event wird dadurch zur Rahmenveranstaltung. Eine Rahmenveranstaltung kann mehrere Unterveranstaltungen enthalten.",
    timePeriodHint:
      "Unterveranstaltungen müssen im Zeitraum der Rahmenveranstaltung liegen und dürfen noch nicht veröffentlich sein.",
    hasParentEventHint:
      "Dein Event ist bereits ein Unterevent einer Rahmenveranstaltung. Daher ist es nicht möglich, Unterveranstaltungen hinzuzufügen. Löse das Event aus dem Rahmenevent heraus, um es selbst zum Rahmenevent zu machen und ihm Unterveranstaltungen hinzuzufügen.",
    add: {
      label: "Eigene Events als untergeordnete Veranstaltungen hinzufügen",
      cta: "Als Unterevent hinzufügen",
    },
  },
} as const;
