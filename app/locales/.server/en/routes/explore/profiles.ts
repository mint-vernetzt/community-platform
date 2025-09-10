export const locale = {
  filter: {
    title: "Filter",
    showFiltersLabel: "Filter profiles",
    offers: "Competencies offered",
    areas: "Area of activity",
    searchAreaPlaceholder: "Enter area or location",
    searchAreaHelper: "At least 3 letters.",
    searchAreaButton: "Search",
    stateLabel: "States",
    districtLabel: "Districts",
    apply: "Apply filter",
    reset: "Reset filter",
    sortBy: {
      label: "Sorting",
      "firstName-asc": "First name (A-Z)",
      "firstName-desc": "First name (Z-A)",
      "lastName-asc": "Last name (A-Z)",
      "lastName-desc": "Last name (Z-A)",
      "createdAt-desc": "Newest first",
    },
    close: "Close filter",
  },
  more: "Load more",
  empty: "Unfortunately, no profiles could be found.",
  notShown_singular:
    "{{count}} profile cannot be viewed because it has marked the specified filter criteria as private information. Private information is only visible to logged in users.",
  notShown_plural:
    "{{count}} profiles cannot be viewed because they have marked the specified filter criteria as private information. Private information is only visible to logged in users.",
  showNumberOfItems_singular: "Show {{count}} profile",
  showNumberOfItems_plural: "Show {{count}} profiles",
} as const;
