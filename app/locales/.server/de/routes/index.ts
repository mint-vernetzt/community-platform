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
      'Deine E-Mail-Adresse wurde noch nicht bestätigt. Deshalb haben wir Dir einen neuen Bestätigungslink gesendet. Bitte überprüfe Dein Postfach und klicke auf den Bestätigungslink. Wenn Du keine E-Mail erhalten hast, überprüfe bitte Deinen Spam-Ordner oder melde Dich beim <a href="mailto:{{supportMail}}" className="mv-text-primary mv-font-bold hover:mv-underline">Support</a>.',
  },
  welcome: "Willkommen in Deiner MINT-Community",
  intro:
    "Entdecke auf der MINTvernetzt Community-Plattform andere MINT-Akteur:innen, Organisationen und MINT-Veranstaltungen und lass Dich für Deine Arbeit inspirieren.",
  opportunities:
    "<strong>Erstelle Profilseiten</strong> für Dich, für Deine <strong>Organisation</strong> und lege <strong>Projekte</strong> oder <strong>Veranstaltungen</strong> an.",
  login: {
    withMintId: "Anmelden mit MINT-ID",
    moreInformation: "Mehr Informationen",
    or: "oder",
    passwordForgotten: "Passwort vergessen?",
    noMember: "Noch kein Mitglied?",
    registerByEmail: "Registrieren mit E-Mail",
    createMintId: "MINT-ID erstellen",
    register: "Registrieren",
    invalidCredentials:
      "Deine Anmeldedaten (E-Mail oder Passwort) sind nicht korrekt. Bitte überprüfe Deine Eingaben.",
    notConfirmed:
      "Deine E-Mail-Adresse wurde noch nicht bestätigt. Bitte überprüfe Dein Postfach und klicke auf den Bestätigungslink. Wenn Du keine E-Mail erhalten hast, überprüfe bitte Deinen Spam-Ordner oder melde Dich beim <0>Support</0>.",
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
  content: {
    education: {
      headline: "Miteinander Bildung gestalten",
      content:
        "Die bundesweite MINT-Community lebt davon, <0>sich auszutauschen, Wissen zu teilen, von- und miteinander zu lernen</0>. Auf der Community-Plattform könnt Ihr Euch <0>untereinander und mit Organisationen vernetzen und Inspiration oder <1>Expert:innen</1></0> zu konkreten Themen in Eurer Umgebung <0>finden</0>.",
      action: "Jetzt registrieren",
    },
    growth: {
      headline: "Wie unsere Community wächst",
      profiles: "Personen",
      organizations: "Organisationen",
      events: "Veranstaltungen",
      projects: "Projekte",
      join: "Werde auch Du Teil unserer ständig wachsenden MINT-Community.",
    },
    more: {
      headline: "Mehr erfahren",
      content:
        "Die MINTvernetzt Community-Plattform ist ein Projekt von MINTvernetzt, das 2021 gestartet ist, um die <0>MINT-Community deutschlandweit nachhaltig zu stärken</0>. Erfahre mehr über die Projekte von <0>MINTvernetzt, der Service- und Anlaufstelle für MINT-Akteur:innen</0> auf der MINTvernetzt-Website.",
      action: "MINTvernetzt-Website besuchen",
    },
    faq: {
      headline: "Fragen und Antworten",
      cta: "Gesamter Hilfebereich",
      supportQuestion: "Findest Du keine Antwort auf Deine Frage?",
      supportCta: "Schreibe uns gerne eine E-Mail an:",
      supportEmail: "support@mint-vernetzt.de",
    },
  },
} as const;
