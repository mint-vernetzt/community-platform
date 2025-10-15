export const locale = {
  root: {
    errorBoundary: {
      title: "Tut uns leid, etwas ist schiefgelaufen...",
      message:
        "Es würde uns freuen, wenn Du uns mit einer E-Mail an <0>{{supportMail}}</0> über den Fehler informierst. Vielen Dank!",
      primaryCta: "Seite neu laden",
      secondaryCta: {
        toLandingPage: "Zur Startseite",
        toDashboard: "Zur Übersicht",
      },
      errorDetails: {
        headline: "Details zur Fehlermeldung",
      },
    },
    toLandingPage: "Zur Startseite",
    toDashboard: "Zum Dashboard",
    community: "Community",
    skipNavBar: {
      start: "Navigationsleiste überspringen",
      end: "Zurück zum Anfang der Navigationsleiste",
    },
    skipMainMenu: {
      start: "Hauptmenü überspringen",
      end: "Zurück zum Anfang des Hauptmenüs",
    },
    or: "oder",
    login: "Anmelden",
    register: "Registrieren",
    search: {
      label: "Suchen",
      placeholder: {
        default: "Suche...",
        xl: "Entdecke die Community und finde neue Förderungen...",
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
    menu: {
      open: "Hauptmenü öffnen",
      close: "Hauptmenü schließen",
      overview: "Überblick",
      personalSpace: {
        label: "Mein MINT-Bereich",
        myProfile: "Mein Profil",
        myOrganizations: "Meine Organisationen",
        myEvents: "Meine Events",
        myProjects: "Meine Projekte",
      },
      resources: {
        label: "Ressourcen",
      },
      explore: {
        label: "Entdecken",
        index: "Alle Inhalte",
        profiles: "Personen",
        organizations: "Organisationen",
        projects: "Projekte",
        events: "Events",
        fundings: "Förderungen",
      },
      languageSwitch: {
        de: "Sprache wechseln zu Deutsch",
        en: "Sprache wechseln zu Englisch",
      },
      help: "Hilfe",
      settings: "Einstellungen",
      logout: "Ausloggen",
      imprint: "Impressum",
      privacy: "Datenschutz",
      terms: "Nutzungsbedingungen",
      accessibilityStatement: "Barrierefreiheit",
    },
    loginOrRegisterCTA: {
      info: "Melde Dich an, um die Plattform in vollem Umfang nutzen zu können.",
      hide: "Information ausblenden",
      login: "Anmelden",
      or: "oder",
      register: "Registrieren",
    },
    scrollToTop: "Nach oben scrollen",
  },
} as const;
