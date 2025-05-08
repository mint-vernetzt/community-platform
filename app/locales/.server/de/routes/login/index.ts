export const locale = {
  validation: {
    email: "Bitte gib eine gültige E-Mail-Adresse ein.",
    password: {
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein.",
    },
  },
  error: {
    invalidCredentials:
      "Deine Anmeldedaten (E-Mail oder Passwort) sind nicht korrekt. Bitte überprüfe Deine Eingaben.",
    notConfirmed:
      'Deine E-Mail-Adresse wurde noch nicht bestätigt. Deshalb haben wir Dir einen neuen Bestätigungslink gesendet. Bitte überprüfe Dein Postfach und klicke auf den Bestätigungslink. Wenn Du keine E-Mail erhalten hast, überprüfe bitte Deinen Spam-Ordner oder melde Dich beim <a href="mailto:{{supportMail}}" className="mv-text-primary mv-font-bold hover:mv-underline">Support</a>.',
  },
  content: {
    headline: "Anmelden",
    question: "Noch kein Mitglied?",
    action: "Registrieren",
  },
  label: {
    email: "E-Mail",
    password: "Passwort",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort ausblenden",
    submit: "Login",
    reset: "Passwort vergessen?",
  },
} as const;
