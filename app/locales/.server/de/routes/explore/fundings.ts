export const locale = {
  title: "Finde Förderungen für Deine Projekte",
  intro:
    "Wir durchsuchen aktuell diese vier Förderdatenbanken nach relevanten Suchbegriffen und spielen die Ergebnisse hier für Dich gesammelt aus:",
  databaseList: "<0>{{0}}</0>, <1>{{1}}</1>, <2>{{2}}</2>, <3>{{3}}</3>.",
  intro2:
    "Nutze die Filterfunktion, um passende Treffer zu erzielen. Jeden Montag werden die Datenbanken durchsucht und die Ergebnisse hier auf der Plattform aktualisiert.",
  more: "Weitere laden",
  empty: "Es konnten leider keine Förderungen gefunden werden.",
  itemsCountSuffix_one: "Förderung",
  itemsCountSuffix_other: "Förderungen",
  showNumberOfItems_singular: "{{count}} Profil anzeigen",
  showNumberOfItems_plural: "{{count}} Profile anzeigen",
  showFiltersLabel: "Förderungen filtern",
  filter: {
    apply: "Filter anwenden",
    reset: "Alles zurücksetzen",
    showMore: "Mehr anzeigen",
    showLess: "Weniger anzeigen",
    type: "Förderart",
    area: "Förderbereich",
    region: "Fördergebiet",
    eligibleEntity: "Förderberechtigte",
    sortBy: {
      label: "Sortierung",
      "title-asc": "Titel (A-Z)",
      "title-desc": "Titel (Z-A)",
      "createdAt-desc": "Neueste zuerst",
    },
  },
  card: {
    region: "Fördergebiet",
    eligibleEntity: "Wer wird gefördert?",
    area: "Was wird gefördert?",
    toFunding: "Zur Förderung",
    notProvided: "-nicht angegeben-",
  },
  survey: {
    title: "Feedback zum Fördertool",
    description:
      "Hilf uns die Fördermittelsuche zu verbessern. Teste Dich durch die Beta-Variante und sende uns Dein Feedback und Deine Ideen an <link1>community@mint-vernetzt.de</link1> mit dem Betreff: Fördermittelsuche.",
  },
} as const;
