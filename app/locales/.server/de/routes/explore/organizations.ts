export const locale = {
  filter: {
    title: "Filter",
    showFiltersLabel: "Organisationen filtern",
    showMore: "Mehr anzeigen",
    showLess: "Weniger anzeigen",
    types: "Organisationsform",
    focuses: "Arbeitsschwerpunkte",
    areas: "Aktivitätsgebiet",
    networkTypes: "Netzwerkform",
    network: "Netzwerk",
    networkSearchPlaceholder: "Nach Netzwerk suchen...",
    searchNetworkHelper: "Mindestens 3 Buchstaben.",
    searchAreaPlaceholder: "Ort oder Gebiet eingeben",
    searchAreaHelper: "Mindestens 3 Buchstaben.",
    stateLabel: "Bundesländer",
    districtLabel: "Orte",
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
  view: {
    list: "Liste",
    map: "Karte",
  },
  empty: "Es konnten leider keine Organisationen gefunden werden.",
  notShown_one:
    "{{count}} Organisation kann nicht angezeigt werden, da es die angegebenen Filterkriterien als private Information gekennzeichnet hat. Private Informationen sind nur für angemeldete Personen sichtbar.",
  notShown_other:
    "{{count}} Organisationen können nicht angezeigt werden, da sie die angegebenen Filterkriterien als private Information gekennzeichnet haben. Private Informationen sind nur für angemeldete Personen sichtbar.",
  more: "Weitere laden",
  showNumberOfItems_one: "{{count}} Organisation anzeigen",
  showNumberOfItems_other: "{{count}} Organisationen anzeigen",
  map: {
    embed: "Aktuelle Kartenansicht auf der eigenen Website einbinden",
    embedModal: {
      title: "Kartenansicht einbetten",
      subline:
        "Du kannst die aktuelle, von Dir mit Hilfe der Filterfunktion, konfigurierte Karte, auf Deiner Website einbinden. Weitere Infos zum Thema, Einbetten der Karte, findest Du in unserem <0>Hilfebereich</0>.",
      description: {
        title: "Führe folgende Schritte aus",
        step1:
          "Konfiguriere Deine Karte entsprechend Deiner Anforderungen hast (Suchbegriff, ausgewählte Filter, Ansicht).",
        step2: "Kopiere den angezeigten Code.",
        step3: "Füge ihn an der passenden Stelle auf Deiner Website ein.",
      },
      textarea: {
        label: "Code zum Einbinden",
      },
      copy: "Kopieren",
      copySuccess: "Code zum Einbinden in die Zwischenablage kopiert",
      cancel: "Abbrechen",
    },
  },
  root: {
    community: "Community",
  },
} as const;
