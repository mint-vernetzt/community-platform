export const locale = {
  headline: "Discover the community",
  intro:
    "Discover profiles from diverse individuals within the STEM community here.",
  filter: {
    title: "Filter",
    showFiltersLabel: "Filter profiles",

    activityAreas: "Field of activity",
    lookingFor: "I'm looking for",
    support: "I want to support with",
    offers: "Competencies offered",
    sort: {
      label: "Sort by",
    },

    areas: "Location / Area",
    searchAreaPlaceholder: "Enter area or location",
    searchAreaHelper: "At least 3 letters.",
    searchAreaButton: "Search",
    stateLabel: "Suggestions by area",
    districtLabel: "Suggestions by location",
    apply: "Apply filter",
    reset: "Reset all",
    sortBy: {
      label: "Sorting",
      "firstName-asc": "First name (A-Z)",
      "firstName-desc": "First name (Z-A)",
      "lastName-asc": "Last name (A-Z)",
      "lastName-desc": "Last name (Z-A)",
      "createdAt-desc": "Newest first",
    },
  },
  more: "Load more",
  empty: "Unfortunately, no profiles could be found.",
  notShown_singular:
    "{{count}} profile cannot be viewed because it has marked the specified filter criteria as private information. Private information is only visible to logged in users.",
  notShown_plural:
    "{{count}} profiles cannot be viewed because they have marked the specified filter criteria as private information. Private information is only visible to logged in users.",
  itemsCountSuffix_singular: "Profile",
  itemsCountSuffix_plural: "profiles",
  showNumberOfItems_singular: "Show {{count}} profile",
  showNumberOfItems_plural: "Show {{count}} profiles",
} as const;
