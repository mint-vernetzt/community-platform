export const locale = {
  error: {
    profileNotFound: "Profile not found",
    notPrivileged: "Not privileged",
    notFound: "Das Profil konnte nicht gefunden werden",
    lastAdmin: {
      intro: "Du bist letzter Administrator in ",
      organizations: "den Organisationen: {{organizations}}",
      events: "den Veranstaltungen: {{events}}",
      projects: "den Projekten: {{projects}}",
      outro:
        "weshalb Dein Profil nicht gelöscht werden kann. Bitte übertrage die Rechte auf eine andere Person oder lösche zuerst diese Organisationen, Veranstaltungen oder Projekte.",
    },
    serverError: "Das Profil konnte nicht gelöscht werden.",
  },
  validation: {
    confirmed: {
      regex: "wirklich löschen",
      message: 'Bitte "wirklich löschen" eingeben.',
    },
  },
  content: {
    headline: "Profil löschen",
    subline: "Schade, dass Du gehst.",
    intro:
      'Bitte gib "wirklich löschen" ein, um das Löschen zu bestätigen. Wenn Du danach auf “Profil endgültig löschen” klickst, wird Dein Profil ohne erneute Abfrage gelöscht.',
  },
  form: {
    confirmed: {
      label: "Löschung bestätigen",
      placeholder: "wirklich löschen",
    },
    submit: {
      label: "Profil endgültig löschen",
    },
  },
} as const;
