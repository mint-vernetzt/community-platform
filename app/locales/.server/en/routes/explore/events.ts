export const locale = {
  title: "Discover Events",
  intro: "Find current events of the STEM community.",
  filter: {
    title: "Filter",
    showFiltersLabel: "Filter events",

    showMore: "Show more",
    showLess: "Show less",

    types: "Event type",
    focuses: "Field of Focus",
    targetGroups: "Target groups",
    periodOfTime: {
      label: "Period of time",
      values: {
        now: "Until now",
        thisWeek: "This week",
        nextWeek: "Next week",
        thisMonth: "This month",
        nextMonth: "Next month",
        past: "Past events",
      },
    },
    apply: "Apply filter",
    reset: "Reset filter",
    sortBy: {
      label: "Sorting",
      values: {
        "startTime-asc": "Next first",
        "name-asc": "Name (A-Z)",
        "name-desc": "Name (Z-A)",
      },
    },
    stage: "Event Type",
    close: "Close filter",
  },

  more: "Load more",
  empty: "Unfortunately, no events could be found.",

  notShown_one:
    "{{count}} event cannot be viewed because it has marked the specified filter criteria as private information. Private information is only visible to logged in users.",
  notShown_other:
    "{{count}} events cannot be viewed because they have marked the specified filter criteria as private information. Private information is only visible to logged in users.",

  showNumberOfItems_one: "Show {{count}} event",
  showNumberOfItems_other: "Show {{count}} events",
} as const;
