export const locale = {
  tabbar: {
    changeURL: "Change URL",
    cancelEvent: "Cancel Event",
    deleteEvent: "Delete Event",
  },
  validation: {
    slug: {
      minLength: "The URL slug must be at least 3 characters long.",
      maxLength: "The URL slug must be at most 50 characters long.",
      pattern:
        "The URL slug may only contain lowercase letters, numbers, hyphens, and underscores.",
    },
  },
} as const;
