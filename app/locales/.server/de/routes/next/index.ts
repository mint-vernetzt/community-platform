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
    fundingSearch: {
      imgAlt: "Ein Sparschwein.",
      headline: "Fördermittelsuche",
      content:
        "Finde passende Förderungen mit unserer Fördermittelsuche. Wir durchsuchen Förderdatenbanken nach relevanten Suchbegriffen und spielen die Ergebnisse gesammelt aus.",
      action: "Zur Fördermittelsuche",
    },
    sharepic: {
      imgAlt: "Ein Bild eines jungen Mädchens mit VR-Brille.",
      headline: "MINT-Sharepic-Generator",
      content:
        "Erstelle ganz einfach Grafiken für Deine Öffentlichkeitsarbeit und nutze datenschutzkonform Deine eigenen Bilder oder greife auf Bilder und Grafiken der integrierten MINT-Mediendatenbank zurück.",
      action: "Zum Sharepic-Generator",
    },
    mediaDatabase: {
      imgAlt: "Vier Bilder als Kacheln angeordnet mit MINT-Bezug.",
      headline: "MINT-Mediendatenbank",
      content:
        "Finde in unserer sich stetig erweiternden Datenbank freie MINT-Bilder und Grafiken, um Deine Öffentlichkeitsarbeit ansprechend und zielgruppengerecht zu gestalten.",
      action: "Zur MINT-Mediendatenbank",
    },
    oeb: {
      imgAlt: "Das Logo von MINT Open Educational Badges.",
      headline: "MINT Open Educational Badges (OEB)",
      content:
        "Erstelle mit Open Educational Badges minutenschnell Badges (digitale Nachweise) für Deine Lernenden und schaffe mehr Sichtbarkeit für die Qualität Deiner Lernangebote.",
      action: "Zu MINT-OEB",
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
      credits: "© Anti Wieland",
    },
    upcomingEvents: {
      headline: "Bevorstehende Events",
      empty: "Zurzeit sind keine bevorstehenden Events geplant.",
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
