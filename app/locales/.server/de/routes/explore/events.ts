export const locale = {
  title: "Entdecke Veranstaltungen",
  intro: "Finde aktuelle Veranstaltungen der MINT-Community.",
  filter: {
    title: "Filter",
    showFiltersLabel: "Veranstaltungen filtern",
    showMore: "Mehr anzeigen",
    showLess: "Weniger anzeigen",
    types: "Veranstaltungsart",
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
        past: "Vergangene Veranstaltungen",
      },
    },
    areas: "Ort / Gebiet",
    searchAreaPlaceholder: "Ort oder Gebiet eingeben",
    searchAreaHelper: "Mindestens 3 Buchstaben.",
    searchAreaButton: "Suchen",
    stateLabel: "Vorschläge nach Gebiet",
    districtLabel: "Vorschläge nach Ort",
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

  empty: "Es konnten leider keine Veranstaltungen gefunden werden.",
  more: "Weitere laden",

  notShown_one:
    "{{count}} Veranstaltung kann nicht angezeigt werden, da es die angegebenen Filterkriterien als private Information gekennzeichnet hat. Private Informationen sind nur für angemeldete Personen sichtbar.",
  notShown_other:
    "{{count}} Veranstaltungen können nicht angezeigt werden, da sie die angegebenen Filterkriterien als private Information gekennzeichnet haben. Private Informationen sind nur für angemeldete Personen sichtbar.",

  showNumberOfItems_one: "{{count}} Veranstaltung anzeigen",
  showNumberOfItems_other: "{{count}} Veranstaltungen anzeigen",
} as const;
