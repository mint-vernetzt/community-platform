export const locale = {
  list: {
    title: "Current Participants",
    subline:
      "Here you can find all the people who have registered for your event. You can search the list and download it as a CSV file.",
    sublineWithChilds:
      "Here you can find all the people who have registered for your main event. You can search the list and also download an extended list as a CSV file. This list additionally includes all participants of the sub-events. Each person is listed only once, even if they have registered for multiple events.",
    fullDepthParticipantsCount:
      "Number of participants including sub-events: {{count}}",
    parentParticipationNotRequiredHint:
      "You have set that people can only register for the sub-events, so here you can only download the extended CSV list with all participants of the sub-events.",
    search: {
      label: "Search People",
      placeholder: "Name or Email Address",
    },
    item: {
      subline: "Registered on {{date}}",
      remove: "Remove",
    },
    more: "Show {{count}} more",
    less: "Show {{count}} less",
    confirmation: {
      title:
        "Do you really want to remove {{firstName}} {{lastName}} from the participants list?",
      description: "The removed person will be informed by email.",
      submit: "Remove",
      abort: "Cancel",
    },
  },
  download: {
    title: "CSV File Download",
    subline:
      "Download the list of participants as a CSV file with name, position, and email address.",
    sublineWithChilds:
      "Download the extended list of participants as a CSV file with name, position, email address, and the events they are attending. This list additionally includes all participants of the sub-events. Each person is listed only once, even if they have registered for multiple events.",
    hint: "<0>Privacy Notice</0>: Use the participant data only for organizing your event and do not share it. By downloading, you take responsibility for handling the data in compliance with privacy regulations. Details can be found in our <1>Privacy Policy</1> and <2>Terms of Use</2>.",
    action: "Save CSV File",
  },
  mail: {
    removeParticipant: {
      subject: "Du wurdest als Teilnehmer:in von einem Event entfernt",
    },
    moveFromWaitingListToParticipants: {
      subject:
        "Du wurdest von der Warteliste zu den Teilnehmenden eines Events hinzugefügt",
    },
  },
  errors: {
    removeParticipant: "Removing the person failed. Please try again.",
  },
  success: {
    removeParticipant: "The person has been removed from the participants list",
  },
} as const;
