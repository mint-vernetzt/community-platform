export const locale = {
  error: {
    profileNotFound: "Profile not found",
  },
  content: {
    notifications: {
      headline: "Mitteilungen",
      hide: "Mitteilungen ausblenden",
      show: "Mitteilungen einblenden",
      canceled: "Veranstaltung abgesagt",
      cta: "Zu meinen Events",
      showMore: "Weitere anzeigen",
      showLess: "Weniger anzeigen",
    },
    header: {
      controls: {
        edit: "Bearbeiten",
      },
      welcome: "Willkommen, {{firstName}} {{lastName}}",
      subline: "in Deiner MINTvernetzt-Community!",
      cta: "Mein Profil besuchen",
    },
    cropper: {
      avatar: {
        headline: "Profilbild ändern",
      },
    },
    updateTeasers: {
      headline: "Updates",
      hide: "Updates ausblenden",
      show: "Updates einblenden",
      entries: {
        faq: {
          headline: "Support",
          description:
            "Neue Hilfeseite mit Antworten auf Fragen rund um die Plattform",
          linkDescription: "Jetzt ansehen",
        },
        createProject: {
          headline: "Wissen teilen",
          description:
            "Eigenes Projekt anlegen oder bereits erstellten Entwurf veröffentlichen",
          linkDescription: "Jetzt anlegen",
        },
        addToOrganization: {
          headline: "Neue Funktion",
          description: "Füge Dich zu Organisationen hinzu",
          linkDescription: "Jetzt ausprobieren",
        },
        crawler: {
          headline: "Neue Funktion",
          description:
            "Finde passende Förderungen mit unserer neuen Fördermittelsuche",
          linkDescription: "Jetzt ausprobieren",
        },
        mediaDatabase: {
          headline: "Neues Feature",
          description:
            "Finde kostenlose MINT-Bilder und Grafiken in der MINT-Mediendatenbank",
          linkDescription: "Jetzt probieren",
        },
      },
    },
    newsTeaser: {
      headline: "MINTvernetzt News",
      hide: "News ausblenden",
      show: "News einblenden",
      entries: {
        tableMedia: {
          headline: "Neue Kooperation",
          description: "Angebot: table.media-Abo für MINTvernetzt Community",
          linkDescription: "Jetzt mehr erfahren",
        },
        annualConference: {
          headline: "Jetzt anmelden",
          description:
            "Programm und Hotelinfos für unsere Jahrestagung vom 11.-12.2.24 in Berlin veröffentlicht",
          linkDescription: "Mehr erfahren",
        },
      },
    },
    communityCounter: {
      headline: "WIE UNSERE COMMUNITY WÄCHST",
      profiles: "Profile",
      organizations: "Organisationen",
      events: "Veranstaltungen",
      projects: "Projekte",
    },
    profiles: "Profile",
    allProfiles: "Alle Profile",
    organizations: "Organisationen",
    allOrganizations: "Alle Organisationen",
    events: "Veranstaltungen",
    allEvents: "Alle Veranstaltungen",
    projects: "Projekte",
    allProjects: "Alle Projekte",
    externalTeasers: {
      headline: "Mehr zu MINTvernetzt",
      entries: {
        website: {
          headline: "Eure Vernetzungsstelle",
          description: "Erfahre mehr über MINTvernetzt",
          linkDescription: "Zur MINTvernetzt Website",
        },
        dataLab: {
          headline: "MINT-DataLab",
          description: "Finde Analysen, Grafiken und Statistiken rund um MINT",
          linkDescription: "Zum MINT-DataLab",
        },
        meshMint: {
          headline: "MesH_MINT",
          description: "Highlights aus der Bildungsforschung",
          linkDescription: "Zu MesH_MINT",
        },
      },
    },
    invites: {
      headline_one: "Du hast {{count}} offene Einladung.",
      headline_other: "Du hast {{count}} offene Einladungen.",
      description:
        "Beantworte die Anfrage und werde damit als Teammitglied der Organisation sichtbar.",
      linkDescription: "Zu meinen Organisationen",
    },
    requests: {
      headline_one: "Du hast {{count}} offene Beitrittsanfrage.",
      headline_other: "Du hast {{count}} offene Beitrittsanfragen.",
      description: "Beantworte die Anfragen für Deine Organisationen.",
      linkDescription: "Zu meinen Organisationen",
    },
  },
} as const;
