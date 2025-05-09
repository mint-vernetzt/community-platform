export const locale = {
  headline: "Entdecke die Community",
  intro: "Hier findest Du die Profile von Akteur:innen der MINT-Community.",
  filter: {
    title: "Filter",
    showFiltersLabel: "Profile filtern",

    activityAreas: "Aktivitätsgebiet",
    lookingFor: "Ich suche",
    support: "Ich möchte unterstützen mit",
    offers: "Angebotene Kompetenzen",
    sort: {
      label: "Sortieren nach",
    },

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
      "firstName-asc": "Vorname (A-Z)",
      "firstName-desc": "Vorname (Z-A)",
      "lastName-asc": "Nachname (A-Z)",
      "lastName-desc": "Nachname (Z-A)",
      "createdAt-desc": "Neueste zuerst",
    },
  },
  more: "Weitere laden",
  empty: "Es konnten leider keine Profile gefunden werden.",
  notShown_singular:
    "{{count}} Profil kann nicht angezeigt werden, da es die angegebenen Filterkriterien als private Information gekennzeichnet hat. Private Informationen sind nur für angemeldete Personen sichtbar.",
  notShown_plural:
    "{{count}} Profile können nicht angezeigt werden, da sie die angegebenen Filterkriterien als private Information gekennzeichnet haben. Private Informationen sind nur für angemeldete Personen sichtbar.",
  itemsCountSuffix_singular: "Profil",
  itemsCountSuffix_plural: "Profile",
  showNumberOfItems_singular: "{{count}} Profil anzeigen",
  showNumberOfItems_plural: "{{count}} Profile anzeigen",
} as const;
