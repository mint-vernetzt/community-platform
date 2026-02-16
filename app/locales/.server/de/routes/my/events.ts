export const locale = {
  title: "Meine Events",
  create: "Event anlegen",
  placeholder: {
    title: "Du hast bislang an keinem Event teilgenommen.",
    description: "Erkunde Events und lerne die Community besser kennen.",
    cta: "Events erkunden",
  },
  invites: {
    title: "Einladungen für Events",
    description:
      "Wenn Du Einladungen annimmst, wirst Du Admin, Teammitglied oder Speaker:in des Events.",
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
    adminInvites: "Admin",
    teamMemberEvents: "Teammitglied",
    speakerEvents: "Speaker:in",
    participantEvents: "Teilnehmer:in",
    waitingListEvents: "Warteliste",
  },
  list: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    waitinglist: "Wartelistenplätze",
    seatsFree: "Plätzen frei",
    unlimitedSeats: "Unbegrenzte Plätze",
    participate: "Teilnehmen",
    accept: "Einladung annehmen",
    reject: "Einladung ablehnen",
  },
  errors: {
    acceptInviteAsAdmin:
      "Fehler beim Akzeptieren der Einladung als Admin für das Event.",
    rejectInviteAsAdmin:
      "Fehler beim Ablehnen der Einladung als Admin für das Event.",
  },
  success: {
    acceptInviteAsAdmin: "Einladung als Admin für das Event angenommen.",
    rejectInviteAsAdmin: "Einladung als Admin für das Event abgelehnt.",
  },
  mail: {
    inviteAsAdminAccepted: {
      subject: "Die Einladung zum Admin eines Events wurde angenommen",
    },
    inviteAsAdminRejected: {
      subject: "Die Einladung zum Admin eines Events wurde abgelehnt",
    },
  },
} as const;
