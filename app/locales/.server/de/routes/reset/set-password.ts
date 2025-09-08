export const locale = {
  validation: {
    password: {
      required: "Bitte gib ein Passwort ein.",
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein.",
    },
    confirmPassword: {
      required: "Bitte gib ein Passwort ein.",
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein.",
    },
    passwordMismatch: "Die Passwörter stimmen nicht überein.",
  },
  content: {
    headline: "Neues Passwort vergeben",
    description:
      "Bitte gib dein neues Passwort ein. Denk daran, dass es mindestens 8 Zeichen lang sein muss. Für mehr Sicherheit empfehlen wir eine Mindestlänge von 12 Zeichen mit Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen.",
  },
  form: {
    label: {
      password: "Neues Passwort *",
      confirmPassword: "Passwort wiederholen *",
      submit: "Passwort speichern",
    },
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort ausblenden",
  },
} as const;
