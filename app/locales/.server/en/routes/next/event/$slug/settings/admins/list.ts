export const locale = {
  title: "Current Admins",
  explanation: "<0>Please note</0>: There must be <0>at least one admin</0>.",
  list: {
    more: "Show {{count}} more",
    less: "Show {{count}} less",
    searchPlaceholder: "Search for admins...",
    remove: "Remove",
  },
  confirmation: {
    title: "Do you really want to remove yourself as an admin?",
    description:
      "If you remove yourself as an admin, you will no longer have access to edit your event.",
    confirm: "Remove as admin",
    abort: "Cancel",
  },
  errors: {
    removeLastAdmin: "You cannot remove the last admin of the event.",
    removeAdminFailed: "Removing the admin has failed.",
  },
  success: {
    removeSelfAsAdmin:
      "You have successfully removed yourself as an admin from the event {{eventName}}.",
    removeAdmin: "The admin has been successfully removed.",
  },
} as const;
