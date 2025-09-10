export const locale = {
  filter: {
    title: "Filter",
    showFiltersLabel: "Filter projects",
    showMore: "Show more",
    showLess: "Show less",
    disciplines: "STEM discipline",
    additionalDisciplines: "STEM in connection with other disciplines",
    targetGroups: "Target group",
    areas: "Area of activity",
    searchAreaPlaceholder: "Enter area or location",
    searchAreaHelper: "At least 3 letters.",
    searchAreaButton: "Search",
    stateLabel: "States",
    districtLabel: "Districts",
    formats: "Project format",
    specialTargetGroups: "Specific target group",
    financings: "Financing",
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
  more: "Load more",
  empty: "Unfortunately, no projects could be found.",
  notShown_one:
    "{{count}} project cannot be viewed because it has marked the specified filter criteria as private information. Private information is only visible to logged in users.",
  notShown_other:
    "{{count}} projects cannot be viewed because they have marked the specified filter criteria as private information. Private information is only visible to logged in users.",
  showNumberOfItems_one: "Show {{count}} project",
  showNumberOfItems_other: "Show {{count}} projects",
} as const;
