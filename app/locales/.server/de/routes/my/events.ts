export const locale = {
  title: "Meine Events",
  create: "Event anlegen",
  placeholder: {
    title: "Du hast bislang an keinem Event teilgenommen.",
    description: "Erkunde Events und lerne die Community besser kennen.",
    cta: "Events erkunden",
  },
  canceled: {
    title_one: "Abgesagtes Event",
    title_other: "Abgesagte Events",
    description_one:
      "Ein Event, zu dem Du Dich angemeldet hattest, wurde abgesagt.",
    description_other:
      "{{count}} Events, zu denen Du Dich angemeldet hattest, wurden abgesagt.",
  },
  upcoming: {
    title_one: "Bevorstehendes Event",
    title_other: "Bevorstehende Events",
  },
  past: {
    title_one: "Vergangenes Event",
    title_other: "Vergangene Events",
  },
  tabBar: {
    adminEvents: "Admin",
    teamMemberEvents: "Teammitglied",
    speakerEvents: "Speaker:in",
    participantEvents: "Teilnehmer:in",
    waitingListEvents: "Warteliste",
  },
} as const;
