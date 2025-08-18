export const locale = {
  title: "Discover organizations",
  intro: "Explore a variety of organizations and networks here.",
  filter: {
    sort: {
      label: "Sort by",
    },

    title: "Filter",
    showFiltersLabel: "Filter organizations",
    showMore: "Show more",
    showLess: "Show less",
    networkTypes: "Network type",
    types: "Organizational form",
    focuses: "Focus of work",
    areas: "Location / Area",
    network: "Network",
    networkSearchPlaceholder: "Search by network...",
    searchAreaPlaceholder: "Enter area or location",
    searchAreaHelper: "At least 3 letters.",
    searchAreaButton: "Search",
    stateLabel: "Suggestions by area",
    districtLabel: "Suggestions by location",
    apply: "Apply filter",
    reset: "Reset filter",
    sortBy: {
      label: "Sorting",
      values: {
        "name-asc": "Name (A-Z)",
        "name-desc": "Name (Z-A)",
        "createdAt-desc": "Newest first",
      },
    },
    close: "Close filter",
  },
  view: {
    list: "List",
    map: "Map",
  },
  empty: "Unfortunately, no organizations could be found.",
  notShown_one:
    "{{count}} organization cannot be viewed because it has marked the specified filter criteria as private information. Private information is only visible to logged in users.",
  notShown_other:
    "{{count}} organizations cannot be viewed because they have marked the specified filter criteria as private information. Private information is only visible to logged in users.",
  more: "Load more",

  showNumberOfItems_one: "Show {{count}} organization",
  showNumberOfItems_other: "Show {{count}} organizations",
} as const;
