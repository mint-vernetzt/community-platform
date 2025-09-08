export const locale = {
  filter: {
    title: "Filter",
    showFiltersLabel: "Events filtern",
    showMore: "Mehr anzeigen",
    showLess: "Weniger anzeigen",
    focuses: "Schwerpunkte",
    targetGroups: "Zielgruppe",
    periodOfTime: {
      label: "Zeitraum",
      values: {
        now: "Ab Heute",
        thisWeek: "Diese Woche",
        nextWeek: "Nächste Woche",
        thisMonth: "Diesen Monat",
        nextMonth: "Nächsten Monat",
        past: "Vergangene Events",
      },
    },
    apply: "Filter anwenden",
    reset: "Filter zurücksetzen",
    sortBy: {
      label: "Sortierung",
      values: {
        "startTime-asc": "Nächste zuerst",
        "name-asc": "Name (A-Z)",
        "name-desc": "Name (Z-A)",
      },
    },
    stage: "Veranstaltungsart",
    close: "Filter schliepen",
  },
  empty: "Es konnten leider keine Events gefunden werden.",
  more: "Weitere laden",
  notShown_one:
    "{{count}} Event kann nicht angezeigt werden, da es die angegebenen Filterkriterien als private Information gekennzeichnet hat. Private Informationen sind nur für angemeldete Personen sichtbar.",
  notShown_other:
    "{{count}} Events können nicht angezeigt werden, da sie die angegebenen Filterkriterien als private Information gekennzeichnet haben. Private Informationen sind nur für angemeldete Personen sichtbar.",
  showNumberOfItems_one: "{{count}} Event anzeigen",
  showNumberOfItems_other: "{{count}} Events anzeigen",
} as const;
