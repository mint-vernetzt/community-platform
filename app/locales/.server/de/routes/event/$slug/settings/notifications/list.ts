export const locale = {
  system: {
    title: "Automatische E-Mails",
    description: "Automatische E-Mails sind nicht editierbar.",
    list: {
      oneDayBefore: {
        title: "Erinnerung – 1 Tag vorher",
        description: "Erinnert Deine Teilnehmenden einen Tag vorher",
        toggle: {
          active: "Erinnerung – 1 Tag vorher deaktivieren",
          inactive: "Erinnerung – 1 Tag vorher aktivieren",
        },
      },
      oneHourBefore: {
        title: "Erinnerung – 1 Stunde vorher",
        description: "Erinnert Deine Teilnehmenden eine Stunde vorher",
        toggle: {
          active: "Erinnerung – 1 Stunde vorher deaktivieren",
          inactive: "Erinnerung – 1 Stunde vorher aktivieren",
        },
      },
      fifteenMinutesBefore: {
        title: "Erinnerung – 15 Minuten vorher",
        description: "Letzter Hinweis kurz vor Start",
        toggle: {
          active: "Erinnerung – 15 Minuten vorher deaktivieren",
          inactive: "Erinnerung – 15 Minuten vorher aktivieren",
        },
      },
      confirmation: {
        title: "Anmeldebestätigung",
        description: "Wird nach erfolgreicher Anmeldung versendet",
      },
      moveUpToParticipants: {
        title: "Nachrückbenachrichtigung",
        description:
          "Wird versendet, wenn ein Platz frei wird und die teilnehmende Person nachrückt",
      },
      cancellation: {
        title: "Absagebenachrichtigung",
        description: "Wird versendet, wenn die Veranstaltung abgesagt wird",
      },
    },
  },
} as const;
