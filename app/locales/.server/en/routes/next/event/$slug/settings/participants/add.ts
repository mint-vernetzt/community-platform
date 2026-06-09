export const locale = {
  title: "Add Participants",
  subline:
    "Invite participants to your event. Invitations must be accepted by the recipients.",
  parentParticipationRequiredHint:
    "Your current setting only allows participation in your sub-event if the main event is also attended. Since you are not an administrator of the main event, you cannot invite participants.",
  search: {
    label: "Search People",
    placeholder: "Name or Email Address",
    helperText: "Enter at least 3 characters.",
    validation: {
      min: "Please enter at least 3 characters to search.",
    },
    submit: "Search",
    result_one: "{{count}} person found.",
    result_other: "{{count}} people found.",
  },
  list: {
    item: {
      alreadyInvited: "already invited",
      alreadyParticipant: "already participating",
      invite: "Invite",
      inviteCreatedAt: "Invited on {{date}}",
    },
    more: "{{count}} more",
    less: "{{count}} less",
  },
  errors: {
    inviteProfileToParticipate:
      "The invitation could not be sent. Please try again later.",
  },
  success: {
    inviteProfileToParticipate: "The invitation was sent successfully.",
  },
  mail: {
    subject: "Invitation to participate in the event {{eventName}}",
    buttonText: "Go to the Community Platform",
  },
} as const;
