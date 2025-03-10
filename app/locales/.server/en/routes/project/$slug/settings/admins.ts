export const locale = {
  error: {
    invariant: {
      invalidRoute: "No valid route",
      notFound: "Not found",
    },
  },
  content: {
    profileAdded: "Added {{firstName}} {{lastName}}",
    profileRemoved: "Removed {{firstName}} {{lastName}}",
    headline: "Administrators",
    intro:
      "Who manages the project on the community platform? Add or remove other administrators here. Administrators can edit, publish, revert to draft, cancel, and delete projects. They are not visible on the project detail page. Team members are shown on the project detail page. They can view projects in draft but cannot edit them.",
    ups: {
      add: "Something went wrong while adding the administrator",
      remove: "Something went wrong while removing the administrator",
    },
    current: {
      headline_one: "Administrator",
      headline_other: "Administrators",
      title: "Administrator",
      remove: "Remove",
    },
    add: {
      headline: "Add administrator",
      search: "Search",
      criteria: "At least 3 characters.",
      submit: "Add",
    },
  },
} as const;
