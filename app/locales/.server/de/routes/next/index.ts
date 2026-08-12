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
