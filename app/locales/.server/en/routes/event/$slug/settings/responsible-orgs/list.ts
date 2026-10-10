export const locale = {
  title: "Current Organizations",
  list: {
    more: "Show {{count}} more",
    less: "Show {{count}} less",
    searchPlaceholder: "Search for organizations...",
    remove: "Remove",
  },
  errors: {
    removeResponsibleOrgFailed: "Failed to remove the organization.",
  },
  success: {
    removeResponsibleOrg: "Organization was successfully removed.",
  },
  mail: {
    subject: "Your role as an organization at the event {{eventName}}",
  },
} as const;
