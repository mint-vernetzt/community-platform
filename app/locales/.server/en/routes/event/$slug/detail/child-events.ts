export const locale = {
  content: {
    title: "Related events",
    more: "Show {{count}} more",
    less: "Show {{count}} less",
    waitinglist: "Waiting list places",
    seatsFree: "Free seats",
    unlimitedSeats: "Unlimited seats",
    participate: "Participate",
    withdrawParticipation: "Withdraw participation",
    joinWaitingList: "Waiting list",
    leaveWaitingList: "Leave waiting list",
    draft: "Draft",
    canceled: "Canceled",
  },
  errors: {
    invalidProfileId: "Invalid data",
    invalidEventId: "Invalid data",
    participate: "Error adding to participants",
    withdrawParticipation: "Error removing from participants",
    joinWaitingList: "Error adding to waiting list",
    leaveWaitingList: "Error removing from waiting list",
  },
  success: {
    participate: "Successfully added to participants",
    withdrawParticipation: "Successfully removed from participants",
    joinWaitingList: "Successfully added to waiting list",
    leaveWaitingList: "Successfully removed from waiting list",
  },
  mail: {
    participate: {
      subject: "Your registration for the event {{eventName}}",
    },
    waitingList: {
      subject:
        "You have been added to the waiting list for the event {{eventName}}",
    },
    removeFromParticipants: {
      subject:
        "Du wurdest von den Teilnehmenden des Events {{eventName}} entfernt",
    },
    removeFromWaitingList: {
      subject:
        "Du wurdest von der Warteliste des Events {{eventName}} entfernt",
    },
    guestRemoved: {
      subject:
        "Du wurdest von den Teilnehmenden des Events {{eventName}} entfernt",
    },
    moveFromWaitingListToParticipants: {
      subject:
        "You have been moved from the waiting list to the participants of the event {{eventName}}",
    },
  },
} as const;
