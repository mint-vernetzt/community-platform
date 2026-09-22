import { locale as helpLocale } from "../../help";

export const locale = {
  validation: {
    email: "Bitte gib eine gültige E-Mail-Adresse ein.",
    password: {
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein.",
      required: "Bitte gib Dein Passwort ein.",
    },
  },
  error: {
    invalidCredentials:
      "Deine Anmeldedaten (E-Mail oder Passwort) sind nicht korrekt. Bitte überprüfe Deine Eingaben.",
    notConfirmed:
      'Deine E-Mail-Adresse wurde noch nicht bestätigt. Deshalb haben wir Dir einen neuen Bestätigungslink gesendet. Bitte überprüfe Dein Postfach und klicke auf den Bestätigungslink. Wenn Du keine E-Mail erhalten hast, überprüfe bitte Deinen Spam-Ordner oder melde Dich beim <a href="mailto:{{supportMail}}" className="text-primary font-bold hover:underline">Support</a>.',
  },
  content: {
    headline: "Gemeinsam MINT-Bildung stärken",
    intro:
      "Finde Menschen, Ideen und Unterstützung für Deine Arbeit in der MINT-Bildung.",
  },
  funding: {
    headline: "Finde 4000+ Förderungen für Deine Arbeit",
    info: "Entdecke Fördermöglichkeiten aus vier Datenbanken, finde zusätzliche Mittel für Deine Projekte und vernetze Dich für gemeinsame Förderanträge.",
    cta: "Förderungen finden",
  },
  counter: {
    profiles: "Profile",
    organizations: "Organisationen",
    events: "Veranstaltungen",
    projects: "Projekte",
  },
  tools: {
    headline: "Tools für Deine Arbeit",
    slider: {
      previous: "Vorherige Tools anzeigen",
      next: "Weitere Tools anzeigen",
    },
    items: {
      sharepic: {
        imgAlt: "Screenshot des Sharepic-Generators",
        headline: "Sharepic-Generator",
        content:
          "Erstelle Grafiken für Deine Öffentlichkeits-arbeit und nutze datenschutz­konform Deine eigenen Bilder oder greife auf Bilder und Grafiken der integrierten MINT-Mediendatenbank zurück.",
        action: "Zum Sharepic-Generator",
      },
      map: {
        imgAlt: "Screenshot der MINT-Community-Karte",
        headline: "MINT-Community-Karte",
        content:
          "Nutze die Karte, um MINT-Organisationen in Deiner Nähe zu finden. Binde die Karte ganz einfach auf Deiner Website ein.",
        action: "MINT-Community-Karte erkunden",
      },
      mediaDatabase: {
        imgAlt: "Screenshot der MINT-Mediendatenbank",
        headline: "MINT-Mediendatenbank",
        content:
          "Finde MINT-Bilder und Grafiken für Deine MINT-Kommunikation: vielfältig, diversitätssensibel und kostenlos.",
        action: "Zur MINT-Mediendatenbank",
      },
      fundings: {
        imgAlt: "Ein Sparschwein",
        headline: "Fördermittelsuche",
        content:
          "Gebündelte Fördermittelsuche – entdecke passende Programme und finde neue Finanzierungsmöglichkeiten für Deine Arbeit.",
        action: "Zur Fördermittelsuche",
      },
    },
  },
  community: {
    headline: "Unsere Community",
    intro:
      "Austausch, der Dich weiterbringt – mit frischen Impulsen aus der Community und neuen Perspektiven von außen.",
    slideshow: {
      showImage: "Bild {{number}} von {{total}} anzeigen",
    },
    items: {
      mvAnnualMeeting: {
        imgAlt:
          "Das jährliche Treffen der MINTvernetzt-Community - Die MINTvernetzt Jahrestagung",
        credit: "© Mark Bollhorst",
      },
      thinkathon24: {
        imgAlt:
          "Der MINTvernetzt Thinkathon 2024 mit der MINTvernetzt-Community",
        credit: "© Heike Fischer Fotografie",
      },
      thinkathon22: {
        imgAlt:
          "Der MINTvernetzt Thinkathon 2022 mit der MINTvernetzt-Community",
        credit: "© Andi Weiland",
      },
      thinkathon22_2: {
        imgAlt:
          "Der MINTvernetzt Thinkathon 2022 mit der MINTvernetzt-Community - Teil 2",
        credit: "© Andi Weiland",
      },
      designBasedLearning: {
        imgAlt:
          "Der MINTvernetzt Design-Based-Learning-Workshop 2025 mit der MINTvernetzt-Community",
        credit: "© Beatrice Barth",
      },
      thinkathon24_2: {
        imgAlt:
          "Der MINTvernetzt Thinkathon 2024 mit der MINTvernetzt-Community - Teil 2",
        credit: "© Heike Fischer Fotografie",
      },
      thinkathon22_3: {
        imgAlt:
          "Der MINTvernetzt Thinkathon 2022 mit der MINTvernetzt-Community - Teil 3",
        credit: "© Andi Weiland",
      },
      thinkathon22_4: {
        imgAlt:
          "Der MINTvernetzt Thinkathon 2022 mit der MINTvernetzt-Community - Teil 4",
        credit: "© Andi Weiland",
      },
      designBasedLearning_2: {
        imgAlt:
          "Der MINTvernetzt Design-Based-Learning-Workshop 2025 mit der MINTvernetzt-Community - Teil 2",
        credit: "© Beatrice Barth",
      },
    },
  },
  login: {
    skip: {
      start: "Anmeldebereich überspringen",
      end: "Zurück zum Anfang des Anmeldebereichs",
    },
    withMintId: "Anmelden mit MINT-ID",
    moreInformation: "Mehr Informationen",
    or: "oder",
    passwordForgotten: "Passwort vergessen",
    noMember: "Noch kein Mitglied?",
    registerByEmail: "Registrieren mit E-Mail",
    createMintId: "MINT-ID erstellen",
  },
  projectTeaser: {
    headline: "Lass Dich von anderen MINT-Projekten inspirieren",
    benefits: {
      ideas: "Ideen und gute Praxis aus der Community",
      cooperations: "Anknüpfungspunkte für Kooperationen finden",
      ownProjects: "Eigene Projekte sichtbar machen",
      learn: "Von Erfahrungen anderer lernen",
    },
    allProjects: "Alle Projekte ansehen",
    image: {
      alt: "Personen an einem Messestand des Projekts Tinkertank",
      credits: "© Andi Weiland",
    },
  },
  eventTeaser: {
    headline: "Entdecke MINT-Events",
    benefits: {
      formats: "Online-, Vor-Ort- oder Hybrid-Events",
      knowledge: "Neues lernen und Wissen weitergeben",
      ownEvents: "Eigene Events erstellen und verwalten",
    },
    allEvents: "Alle Events ansehen",
    image: {
      alt: "Zwei Personen auf einer Bühne bei einem MINT-Event",
      credits: "© Andi Weiland",
    },
    upcomingEvents: {
      headline: "Bevorstehende Events",
      empty: "Zurzeit sind keine bevorstehenden Events geplant.",
    },
    waitinglist: "Wartelistenplätze",
    seatsFree: "Plätzen frei",
    unlimitedSeats: "Unbegrenzte Plätze",
  },
  testimonials: {
    headline: "Stimmen aus der Community",
    controls: {
      previous: "Vorherige Stimmen anzeigen",
      next: "Nächste Stimmen anzeigen",
    },
  },
  communityCta: {
    headline: "Gestalte die Plattform aktiv mit",
    intro:
      "Deine Perspektive hilft, die Plattform weiterzuentwickeln. Bring Deine Ideen ein oder teste neue Funktionen frühzeitig. Erfahre mehr über geplante Features und wie Du Dich einbringen kannst.",
    getInvolved: "Jetzt mitgestalten",
  },
  about: {
    headline: "Wer hinter der Plattform steht",
    description:
      "Die MINTvernetzt Community-Plattform ist ein Projekt von MINTvernetzt. MINTvernetzt ist die zentrale Anlaufstelle für die außerschulische MINT-Bildung in Deutschland. Wir werden finanziert vom Bundesministerium für Bildung, Familie, Senioren, Frauen und Jugend.",
    moreInformation:
      "Erfahre mehr über MINTvernetzt und weitere Projekte auf unserer Website.",
    website: "MINTvernetzt Website",
    image: {
      alt: "Das MINTvernetzt-Team steht auf einer Wendeltreppe",
      credits: "© Mark Bollhorst",
    },
  },
  faq: {
    headline: "Fragen und Antworten",
    cta: "Gesamter Hilfebereich",
    qAndAs: {
      whatIsStem: helpLocale.faq.stemEducation.qAndAs.whatIsStem,
      whoIsThePlatformFor:
        helpLocale.faq.generalPlatformInformation.qAndAs.whoIsThePlatformFor,
      benefitsOfThePlatform:
        helpLocale.faq.generalPlatformInformation.qAndAs.benefitsOfThePlatform,
      isItFree: helpLocale.faq.generalPlatformInformation.qAndAs.isItFree,
      benefitsOfRegistration:
        helpLocale.faq.registration.qAndAs.benefitsOfRegistration,
      mintId: helpLocale.faq.registration.qAndAs.mintId,
    },
  },
  form: {
    label: {
      email: "E-Mail",
      password: "Passwort",
      showPassword: "Passwort anzeigen",
      hidePassword: "Passwort ausblenden",
      submit: "Anmelden",
    },
  },
} as const;
