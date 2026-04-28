export const locale = {
  limit: {
    headline: "Limitation of participants",
    subline:
      "Set a limit for the number of participants and manage the waiting list.",
    form: {
      participantLimit: {
        label: "Max. number of participants",
        placeholder: "Enter a number.",
        helper:
          "If you don't enter a number, your event will be displayed as “No participation limit”.",
      },
      hint: "Even if the maximum number of participants is reached, you can add people from the waiting list or invite more people.",
      reset: "Discard changes",
      submit: "Save input",
      modal: {
        title: "Do you really want to change your participant limit?",
        description:
          "The <0>maximum number of participants ({{participantLimit}})</0> you set is below the <0>number of current registrations ({{participantsCount}})</0>. To manage your participants, go to the <0>Participants</0> page in your event settings.",
        submit: "Change limit anyway",
        cancel: "Cancel",
      },
    },
  },
  waitingList: {
    headline: "Handling the waiting list",
    subline:
      "Determine what should happen when spots in your event become available.",
    form: {
      moveUpToParticipants: {
        label: "Waiting people should automatically move up.",
      },
      hint: "Regardless of whether your waiting people automatically move up, you can always also manually allow people from the waiting list as participants.",
      submit: "Save",
    },
  },
  errors: {
    moveUpToParticipants:
      "An error occurred while updating settings. Please try again.",
    participantLimit:
      "An error occurred while updating settings. Please try again.",
  },
  success: {
    moveUpToParticipants: "Settings updated successfully.",
    participantLimit: "Settings updated successfully.",
  },
} as const;
