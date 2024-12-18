export const locale = {
  title: "Entdecke Organisationen",
  intro: "Hier findest Du Organisationen und Netzwerke.",
  filter: {
    sort: {
      label: "Sortieren nach",
    },

    title: "Filter",
    showFiltersLabel: "Organisationen filtern",

    types: "Organisationsform",
    focuses: "Arbeitsschwerpunkte",
    areas: "Ort / Gebiet",
    searchAreaPlaceholder: "Ort oder Gebiet eingeben",
    searchAreaHelper: "Mindestens 3 Buchstaben.",
    searchAreaButton: "Suchen",
    stateLabel: "Vorschläge nach Gebiet",
    districtLabel: "Vorschläge nach Ort",
    apply: "Filter anwenden",
    reset: "Alles zurücksetzen",
    sortBy: {
      label: "Sortierung",
      values: {
        "name-asc": "Name (A-Z)",
        "name-desc": "Name (Z-A)",
        "createdAt-desc": "Neueste zuerst",
      },
    },
  },
  empty: "Es konnten leider keine Organisationen gefunden werden.",
  notShown_one:
    "{{count}} Organisation kann nicht angezeigt werden, da es die angegebenen Filterkriterien als private Information gekennzeichnet hat. Private Informationen sind nur für angemeldete Personen sichtbar.",
  notShown_other:
    "{{count}} Organisationen können nicht angezeigt werden, da sie die angegebenen Filterkriterien als private Information gekennzeichnet haben. Private Informationen sind nur für angemeldete Personen sichtbar.",
  more: "Weitere laden",

  itemsCountSuffix_one: "Organisation",
  itemsCountSuffix_other: "Organisationen",
  showNumberOfItems_one: "{{count}} Organisation anzeigen",
  showNumberOfItems_other: "{{count}} Organisationen anzeigen",
} as const;
