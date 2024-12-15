export const locale = {
  validation: {
    confirmedToken: {
      regex: "wirklich löschen",
      message: 'Bitte "wirklich löschen" eingeben.',
    },
  },
  error: {
    serverError: "Die Organisation konnte nicht gelöscht werden.",
    validation: "Validation failed",
    notPrivileged: "Not privileged",
    notFound: "Profile not found",
  },
  content: {
    headline: "Organisation löschen",
    intro: "Schade, dass Du Eure Organisation löschen willst.",
    confirmation:
      'Bitte gib "wirklich löschen" ein, um das Löschen zu bestätigen. Wenn Du danach auf Organisation endgültig löschen” klickst, wird Eure Organisation ohne erneute Abfrage gelöscht.',
  },
  form: {
    confirmedToken: {
      label: "Löschung bestätigen",
      placeholder: "wirklich löschen",
    },
    submit: {
      label: "Organisation endgültig löschen",
    },
  },
} as const;
