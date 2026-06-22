export const locale = {
  explanation:
    "To delete your event, please enter the name of your event <0>{{eventName}}</0> in the provided field for confirmation. Then click on <0>Delete Event</0>.",
  hint: "<0>Please note</0>: Once you delete your event, all data related to it will be permanently removed and cannot be recovered.",
  label: "Event Name",
  submit: "Delete Event",
  validation: {
    errors: {
      eventNameMismatch: "The entered name must match the name of your event.",
    },
  },
  errors: {
    deleteFailed:
      "An error occurred while deleting the event. Please try again.",
  },
  success: "The event {{eventName}} has been successfully deleted.",
} as const;
