export const locale = {
  validation: {
    password: {
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein.",
    },
    confirmPassword: {
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein.",
    },
    accessToken: {
      min: "Bitte nutze den Link aus Deiner E-Mail, um Dein Passwort zu ändern.",
    },
    refreshToken: {
      min: "Bitte nutze den Link aus Deiner E-Mail, um Dein Passwort zu ändern.",
    },
  },
  error: {
    badRequest:
      "Did not provide access or refresh token to reset the password.",
    confirmation: "Deine Passwörter stimmen nicht überein.",
  },
  form: {
    label: {
      password: "Neues Passwort",
      confirmPassword: "Passwort wiederholen",
      submit: "Passwort speichern",
    },
  },
} as const;
