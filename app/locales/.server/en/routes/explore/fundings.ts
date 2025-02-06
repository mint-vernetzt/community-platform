export const locale = {
  title: "Find funding for your projects",
  intro:
    "We are currently searching these four funding databases for relevant search terms and displaying the results collected here for you:",
  databaseList: "<0>{{0}}</0>, <1>{{1}}</1>, <2>{{2}}</2>, <3>{{3}}</3>.",
  intro2:
    "Use the filter function to achieve suitable results. Every Monday, the databases are searched and the results are updated here on the platform.",
  more: "Load more",
  empty: "Unfortunately, no fundings could be found.",
  itemsCountSuffix_one: "funding",
  itemsCountSuffix_other: "fundings",
  showNumberOfItems_singular: "Show {{count}} funding",
  showNumberOfItems_plural: "Show {{count}} fundings",
  showFiltersLabel: "Filter fundings",
  filter: {
    apply: "Apply filter",
    reset: "Reset all",
    showMore: "Show more",
    showLess: "Show less",
    type: "Funding type",
    area: "Funding area",
    region: "Funding region",
    eligibleEntity: "Eligible entity",
    sortBy: {
      label: "Sorting",
      "title-asc": "Title (A-Z)",
      "title-desc": "Title (Z-A)",
      "createdAt-desc": "Newest first",
    },
  },
  card: {
    region: "Funding region",
    eligibleEntity: "Who will receive funding?",
    area: "What is being funded?",
    toFunding: "To funding",
    notProvided: "-not provided-",
  },
  survey: {
    title: "Feedback on the funding search",
    description:
      "Help us improve the funding search. Test yourself through the beta version and send us your feedback and ideas to <link1>community@mint-vernetzt.de</link1> with the subject: Funding search.",
  },
} as const;
