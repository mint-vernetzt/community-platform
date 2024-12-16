export const locale = {
  validation: {
    email: {
      email: "Bitte gib eine gültige E-Mail-Adresse ein.",
      min: "Bitte gib eine gültige E-Mail-Adresse ein.",
    },
    password: {
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein.",
    },
  },
  error: {
    invalidCredentials:
      "Deine Anmeldedaten (E-Mail oder Passwort) sind nicht korrekt. Bitte überprüfe Deine Eingaben.",
    notConfirmed:
      "Deine E-Mail-Adresse wurde noch nicht bestätigt. Bitte überprüfe Dein Postfach und klicke auf den Bestätigungslink. Wenn Du keine E-Mail erhalten hast, überprüfe bitte Deinen Spam-Ordner oder melde Dich beim <0>Support</0>.",
    confirmationLinkExpired:
      "Dein Bestätigungslink ist abgelaufen. Bitte melde Dich beim <0>Support</0> um einen neuen anzufordern.",
  },
  content: {
    headline: "Anmelden",
    question: "Noch kein Mitglied?",
    action: "Registrieren",
  },
  label: {
    email: "E-Mail",
    password: "Passwort",
    submit: "Login",
    reset: "Passwort vergessen?",
  },
} as const;
