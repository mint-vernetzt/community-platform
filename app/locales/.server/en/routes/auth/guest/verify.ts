export const locale = {
  confirmation: {
    subject: "You have successfully registered for an event",
    success: {
      participant: "You are now registered as a participant for the event.",
      waitingList: "You are now registered on the waiting list for the event.",
    },
    notFound: {
      title: "No guest found",
      description:
        "No guest could be found with the provided token. It is possible that you have already confirmed your registration. Please check your email inbox and, if necessary, also the spam folder. If you did not receive an email, please contact our <0>support</0>.",
    },
  },
  revocation: {
    subject: "You have successfully revoked your registration for the event",
    success: {
      participant:
        "You have successfully revoked your registration for the event.",
    },
    notFound: {
      title: "No guest found",
      description:
        "No guest could be found with the provided token. It is possible that you have already revoked your registration. Please check your email inbox and, if necessary, also the spam folder. If you did not receive an email, please contact our <0>support</0>.",
    },
  },
} as const;
