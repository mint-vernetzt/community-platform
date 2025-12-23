export const locale = {
  explanation:
    "Once you cancel the event, all registered participants will automatically receive an email with the cancellation information.",
  hint: "Your event is already published. You have the option to cancel your event. After that, you will also be able to delete it here.",
  cancel: "Cancel event",
  confirmation: {
    title: "Do you really want to cancel {{eventName}}?",
    description: "This action cannot be undone. ",
    confirm: "Cancel event",
    abort: "Cancel",
  },
  success: "The event has been cancelled.",
  errors: {
    cancelFailed:
      "An error occurred while cancelling the event. Please try again.",
  },
} as const;
