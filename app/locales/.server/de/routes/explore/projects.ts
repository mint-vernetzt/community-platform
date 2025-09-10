export const locale = {
  filter: {
    title: "Filter",
    showFiltersLabel: "Projekte filtern",
    showMore: "Mehr anzeigen",
    showLess: "Weniger anzeigen",
    disciplines: "MINT-Disziplin",
    additionalDisciplines: "MINT in Verbindung mit weiteren Disziplinen",
    targetGroups: "Zielgruppe",
    areas: "Aktivitätsgebiet",
    searchAreaPlaceholder: "Ort oder Gebiet eingeben",
    searchAreaHelper: "Mindestens 3 Buchstaben.",
    searchAreaButton: "Suchen",
    stateLabel: "Bundesländer",
    districtLabel: "Orte",
    formats: "Projektformat",
    specialTargetGroups: "Spezifische Zielgruppe",
    financings: "Finanzierung",
    apply: "Filter anwenden",
    reset: "Filter zurücksetzen",
    sortBy: {
      label: "Sortierung",
      values: {
        "name-asc": "Name (A-Z)",
        "name-desc": "Name (Z-A)",
        "createdAt-desc": "Neueste zuerst",
      },
    },
    close: "Filter schließen",
  },
  more: "Weitere laden",
  empty: "Es konnten leider keine Projekte gefunden werden.",
  notShown_one:
    "{{count}} Projekt kann nicht angezeigt werden, da es die angegebenen Filterkriterien als private Information gekennzeichnet hat. Private Informationen sind nur für angemeldete Personen sichtbar.",
  notShown_other:
    "{{count}} Projekte können nicht angezeigt werden, da sie die angegebenen Filterkriterien als private Information gekennzeichnet haben. Private Informationen sind nur für angemeldete Personen sichtbar.",
  showNumberOfItems_one: "{{count}} Projekt anzeigen",
  showNumberOfItems_other: "{{count}} Projekte anzeigen",
} as const;
