export const locale = {
  system: {
    title: "Automatische E-Mails",
    description: "Automatische E-Mails sind nicht editierbar.",
    list: {
      close: "Schließen",
      preview: "Ansehen",
      oneDayBefore: {
        title: "Erinnerung – 1 Tag vorher",
        description: "Erinnert Deine Teilnehmenden einen Tag vorher",
      },
      oneHourBefore: {
        title: "Erinnerung – 1 Stunde vorher",
        description: "Erinnert Deine Teilnehmenden eine Stunde vorher",
      },
      fifteenMinutesBefore: {
        title: "Erinnerung – 15 Minuten vorher",
        description: "Letzter Hinweis kurz vor Start",
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
