export const locale = {
  title: "Participants Waiting List",
  subline:
    "Here you can find the list of participants who are currently on the waiting list for this event.",
  hints: {
    automaticallyMoveToParticipants:
      "<0>Note</0>: On the <0>Registration > </0><1>Participation Limit</1> page, you have selected that freed-up spots are automatically filled. However, you can still manually add individual participants.",
    manuallyMoveToParticipants:
      "<0>Note</0>: Should the waiting list participants automatically move up when a spot becomes available? You can find this setting under <0>Registration > </0><1>Participation Limit</1>.",
  },
  search: {
    label: "Search People",
    placeholder: "Search by name",
  },
  list: {
    item: {
      subline: "waiting since {{date}}",
      add: "Allow as participant",
    },
    more: "Show {{count}} more",
    less: "Show {{count}} less",
  },
  errors: {
    moveToParticipants:
      "An error occurred while adding the person to the participants. Please try again.",
  },
  success: {
    moveToParticipants:
      "The person has been moved from the waiting list to the participants.",
  },
  mail: {
    moveToParticipants: {
      subject:
        "You have been moved from the waiting list to the participants of an event",
    },
  },
} as const;
