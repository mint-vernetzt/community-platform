export const locale = {
  title: "Entdecke inspirierende Projekte",
  intro:
    "Finde passende Projekte, lerne von Erfahrungen anderer MINT-Akteur:innen und teile Dein Wissen, indem Du Dein eigenes Projekt anlegst.",
  filter: {
    title: "Filter",
    showFiltersLabel: "Projekte filtern",

    showMore: "Mehr anzeigen",
    showLess: "Weniger anzeigen",

    sort: {
      label: "Sortieren nach",
    },

    disciplines: "MINT-Disziplin",
    additionalDisciplines: "MINT in Verbindung mit weiteren Disziplinen",
    targetGroups: "Zielgruppe",
    areas: "Ort / Gebiet",
    searchAreaPlaceholder: "Ort oder Gebiet eingeben",
    searchAreaHelper: "Mindestens 3 Buchstaben.",
    searchAreaButton: "Suchen",
    stateLabel: "Vorschläge nach Gebiet",
    districtLabel: "Vorschläge nach Ort",
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
