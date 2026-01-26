export const locale = {
  error: {
    profileNotFound: "Profile not found",
  },
  content: {
    notifications: {
      headline: "Mitteilungen",
      hide: "Mitteilungen ausblenden",
      show: "Mitteilungen einblenden",
      showMore: "Weitere anzeigen",
      showLess: "Weniger anzeigen",
      cancelledEvents: {
        cancelled: "Event abgesagt",
        cta: "Zu meinen Events",
      },
      acceptedClaimRequests: {
        headline:
          "Deine Anfrage zum Übernehmen der Organisation wurde bestätigt.",
        description:
          "Du bist nun <0>Administrator:in</0> der Organisation <0>{{name}}</0>.",
        cta: "Zur Organisation",
      },
    },
    header: {
      controls: {
        edit: "Bearbeiten",
      },
      welcome: "Willkommen, {{firstName}} {{lastName}}",
      subline: "in Deiner MINTvernetzt-Community!",
      cta: "Mein Profil besuchen",
    },
    search: {
      headline: "Entdecke die Community und finde neue Förderungen",
      label: "Suchen",
      placeholder: {
        default: "Suche...",
        xl: "Suche nach",
        rotation: [
          "Inspiration aus der MINT-Welt",
          "Organisationen",
          "Förderungen",
          "Events",
          "Personen",
        ],
      },
      clear: "Suchfeld leeren",
      entities: {
        profile: "Person",
        organization: "Organisation",
        event: "Event",
        project: "Projekt",
        funding: "Förderung",
        profiles: "Personen",
        organizations: "Organisationen",
        events: "Events",
        projects: "Projekte",
        fundings: "Förderungen",
      },
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
        resources: {
          headline: "Tools & Wissen",
          description: "Unterstützung für Deine MINT-Arbeit",
          linkDescription: "Jetzt Ressourcen entdecken",
        },
        mapView: {
          headline: "Neues Feature",
          description:
            "Die neue MINT-Community Karte zeigt Dir, wer wo aktiv ist!",
          linkDescription: "Zur MINT-Community-Karte",
        },
        actionDaysPromotions: {
          headline: "Jetzt Aktionen einreichen",
          description: "Programm der digitalen MINT-Aktionstage mitgestalten",
          linkDescription: "Mehr Infos",
        },
        actionDays: {
          headline: "MINT-Aktionstage",
          description: "Programm der digitalen MINT-Aktionstage veröffentlicht",
          linkDescription: "Jetzt anmelden",
        },
        networks: {
          headline: "Neue Netzwerk-Funktion",
          description:
            "Mach Dein Netzwerk sichtbar – füge Mitglieder hinzu und wähle aus ob Ihr Cluster, MINT-Region oder Landesinitiative seid",
          linkDescription: "Jetzt Netzwerkform auswählen",
        },
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
          linkDescription: "Förderung suchen",
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
      profiles: "Personen",
      organizations: "Organisationen",
      events: "Veranstaltungen",
      projects: "Projekte",
    },
    profiles: "Personen",
    allProfiles: "Alle Personen",
    organizations: "Organisationen",
    allOrganizations: "Alle Organisationen",
    events: "Events",
    allEvents: "Alle Events",
    projects: "Projekte",
    allProjects: "Alle Projekte",
    invites: {
      headline_one:
        "Du hast {{count}} offene Einladung von einer Organisation.",
      headline_other:
        "Du hast {{count}} offene Einladungen von Organisationen.",
      description:
        "Wenn Du Einladungen bestätigst, wirst Du als <0>Teammitglied/Admin</0> der Organisation sichtbar.",
      linkDescription: "Zu meinen Organisationen",
    },
    requests: {
      headline_one: "Deine Organisation hat {{count}} offene Beitrittsanfrage.",
      headline_other:
        "Deine Organisation hat {{count}} offene Beitrittsanfragen.",
      description:
        "Wenn Du Anfragen bestätigst, werden Personen als <0>Teammitglieder/Admins</0> Deiner Organisation sichtbar.",
      linkDescription: "Zu meinen Organisationen",
    },
    networkInvites: {
      headline_one:
        "Deine Organisation hat {{count}} offene Netzwerkeinladung.",
      headline_other:
        "Deine Organisation hat {{count}} offene Netzwerkeinladungen.",
      description:
        "Wenn Du Einladungen bestätigst, wird Deine Organisation als <0>Netzwerkmitglied</0> sichtbar.",
      linkDescription: "Zu meinen Organisationen",
    },
    networkRequests: {
      headline_one:
        "Dein Netzwerk hat {{count}} offene Beitrittsanfrage einer Organisation.",
      headline_other:
        "Dein Netzwerk hat {{count}} offene Beitrittsanfragen von Organisationen.",
      description:
        "Wenn Du Anfragen bestätigst, werden die Organisationen als <0>Netzwerkmitglieder</0> sichtbar.",
      linkDescription: "Zu meinen Organisationen",
    },
    eventAdminInvites: {
      headline_one:
        "Du hast {{count}} offene Administrator:innen-Einladung für ein Event.",
      headline_other:
        "Du hast {{count}} offene Administrator:innen-Einladungen für Events.",
      description:
        "Wenn Du Einladungen bestätigst, wirst du als <0>Event-Administrator:in</0> sichtbar.",
      linkDescription: "Zu meinen Events",
    },
  },
} as const;
