export const locale = {
  error: {
    invalidRoute: "No valid route",
    notFound: "Not found",
  },
  content: {
    added: "Added {{firstName}} {{lastName}}.",
    removed: "Removed {{firstName}} {{lastName}}.",
    back: "Manage team",
    intro:
      "Who is part of your project? Add or remove additional team members here. Team members are shown on the projects detail page. They cannot edit projects.",
    current: {
      headline: "Current team members",
      intro: "Team members and roles are listed here.",
      member: {
        admin: "Administrator",
        team: "Team member",
      },
      remove: "Remove",
    },
    add: {
      headline: "Add team member",
      search: "Search",
      requirements: "At least 3 letters.",
      add: "Add",
    },
  },
} as const;
