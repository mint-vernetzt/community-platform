export const locale = {
  headline: "Registration Period",
  subline:
    "The registration period defines the timeframe during which participants can register for your event. It is automatically set upon event creation.",
  default: {
    label: "Allow registration until the event starts",
  },
  custom: {
    label: "Set custom registration period",
    form: {
      fields: {
        participationFromDate: "Start date for registration",
        participationFromTime: "Start time",
        participationUntilDate: "End date for registration",
        participationUntilTime: "End time",
      },
      submit: "Save",
      reset: "Discard changes",
      errors: {
        participationFromDateRequired:
          "Please provide a start date for the registration.",
        participationFromTimeRequired:
          "Please provide a start time for the registration.",
        participationUntilDateRequired:
          "Please provide an end date for the registration.",
        participationUntilTimeRequired:
          "Please provide an end time for the registration.",
        participationUntilDateInPast:
          "The end date for the registration is in the past.",
        participationUntilTimeInPast:
          "The end time for the registration is in the past.",
        participationFromDateAfterParticipationUntilDate:
          "The start of the registration period is after the end of the registration period.",
        participationFromTimeAfterParticipationUntilTime:
          "The start time is after the end time.",
        participationFromDateAfterStartDate:
          "Your registration period starts after your event starts.",
        participationFromTimeAfterStartTime:
          "The start time of the registration period is after the start time of your event.",
      },
    },
  },
  errors: {
    updateRegistrationPeriodError:
      "An error occurred while updating the registration period. Please try again.",
  },
  success: {
    updateRegistrationPeriodSuccess:
      "The registration period has been successfully updated.",
  },
} as const;
