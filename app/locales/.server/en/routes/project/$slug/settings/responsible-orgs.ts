export const locale = {
  error: {
    invalidRoute: "No valid route",
    notFound: "Not found",
  },
  content: {
    added: "Added {{name}}.",
    removed: "Removed {{name}}.",
    back: "Responsible organizations",
    intro:
      "Which organizations are behind the project? Manage the responsible organizations here.",
    current: {
      headline: "Currently added organization(s)",
      intro:
        "Here you can see organizations that have currently been registered as responsible organizations.",
      remove: "Remove",
    },
    add: {
      headline: "Add your own organization(s).",
      intro:
        "Your own organizations will be listed here so that you can add them as responsible organizations with one click.",
      add: "Add",
    },
    other: {
      headline: "Add other organization(s).",
      search: {
        label: "Search",
        helper: "At least 3 letters.",
      },
      add: "Add",
    },
  },
} as const;
