export const locale = {
  login: "Anmelden",
  validation: {
    email: {
      email: "Bitte gib eine gültige E-Mail-Adresse ein.",
      min: "Bitte gib eine gültige E-Mail-Adresse ein.",
    },
  },
  response: {
    headline: "Passwort zurücksetzen",
    done: {
      prefix: "Eine E-Mail zum Zurücksetzen des Passworts wurde an",
      suffix: "geschickt.",
    },
    notice:
      "Solltest Du Dich noch nicht unter dieser E-Mail-Adresse registriert haben, erhältst Du keine E-Mail zum Zurücksetzen des Passworts.",
  },
  form: {
    intro:
      "Du hast Dein Passwort vergessen? Dann gib hier Deine E-Mail-Adresse ein, die Du bei der Anmeldung verwendet hast. Wir senden Dir eine Mail, über die Du ein neues Passwort einstellen kannst.",
    label: {
      email: "E-Mail",
      submit: "Passwort zurücksetzen",
    },
  },
} as const;
