export const locale = {
  explanation:
    "Sobald Du das Event absagst, erhalten alle angemeldeten Teilnehmer:innen automatisch eine E-Mail mit der Info zur Absage.",
  hint: {
    explanation:
      "Dein Event ist bereits veröffentlicht. Du hast die Möglichkeit Dein Event abzusagen. Danach wirst Du es hier auch löschen können.",
    childEvents:
      "Dein Event hat Unterveranstaltungen. Wenn Du es absagst, werden Teilnehmende, Speaker:innen, Teammitglieder und Admins Deines Events und der Unterveranstaltungen über die Absage informiert.",
  },
  cancel: "Event absagen",
  confirmation: {
    cancelOnlyThis: {
      title: "Willst Du wirklich {{eventName}} absagen?",
      description: "Diese Aktion kannst Du nicht mehr rückgängig machen. ",
      confirm: "Event absagen",
      abort: "Abbrechen",
    },
    cancelAll: {
      title: "{{eventName}} und alle verknüpften Unterevents absagen?",
      description:
        "Dein Event und die zugehörigen Unterveranstaltungen werden unwiderruflich abgesagt. ",
      confirm: "Events absagen",
      abort: "Abbrechen",
    },
  },
  success: "Das Event wurde abgesagt.",
  errors: {
    cancelFailed:
      "Beim Absagen des Events ist ein Fehler aufgetreten. Bitte versuche es erneut.",
  },
  childEventsList: {
    waitinglist: "Wartelistenplätze",
    seatsFree: "Plätzen frei",
    unlimitedSeats: "Unbegrenzte Plätze",
    more: "Mehr anzeigen",
    less: "Weniger anzeigen",
    hint_singular: "Zu Deinem Event gehört eine Unterveranstaltung.",
    hint_plural: "Zu Deinem Event gehören {{count}} Unterveranstaltungen.",
  },
  handlingChildEvents: {
    description:
      "Entscheide, wie Du mit den Unterveranstaltungen umgehen möchtest.",
    cancelOnlyThis: {
      headline: "Nur Rahmenevent absagen",
      description:
        "Die Rahmenveranstaltung wird abgesagt, die Unterevents bleiben als eigenständige Events bestehen.",
    },
    cancelAll: {
      headline: "Rahmenevent mit meinen Unterevents absagen",
      description:
        "Sowohl die Rahmenveranstaltung als auch alle von mir administrierten Unterveranstaltungen werden abgesagt.",
    },
  },
} as const;
