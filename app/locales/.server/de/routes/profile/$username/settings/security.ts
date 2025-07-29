export const locale = {
  validation: {
    email: {
      min: "Bitte gib eine gültige E-Mail-Adresse ein.",
      required: "Bitte gib eine gültige E-Mail-Adresse ein.",
    },
    confirmEmail: {
      min: "Bitte gib eine gültige E-Mail-Adresse ein.",
      required: "Bitte gib eine gültige E-Mail-Adresse ein.",
    },
    password: {
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein.",
      required: "Bitte gib ein Passwort ein.",
    },
    confirmPassword: {
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein.",
      required: "Bitte gib das Passwort zur Bestätigung ein.",
    },
  },
  error: {
    emailsDontMatch: "Deine E-Mails stimmen nicht überein.",
    passwordMismatch: "Die Passwörter stimmen nicht überein.",
    notPrivileged: "Not privileged",
    notAllowed: "Not allowed.",
    noStringIntent: "Intent must be a string.",
    wrongIntent: "Wrong intent.",
    updatePasswordFailed: "Passwortaktualisierung fehlgeschlagen.",
    emailChangeFailed: "E-Mail-Änderung fehlgeschlagen.",
    sendEmailNoticeFailed: "Fehler beim Senden der E-Mail-Benachrichtigung.",
    emailAlreadyUsed:
      "Diese E-Mail-Adresse wird bereits von einer anderen Person verwendet.",
  },
  content: {
    headline: "Login und Sicherheit",
  },
  section: {
    changePassword1: {
      headline: "Passwort oder E-Mail-Adresse ändern",
      intro:
        "Du nutzt die MINT-ID und kannst deshalb deine E-Mail-Adresse und Dein Passwort nur auf <0>mint-id.org</0> ändern.",
    },
    changePassword2: {
      headline: "Passwort ändern",
      feedback:
        "Dein Passwort wurde geändert. Es wurde eine Benachrichtigung an die alte E-Mail-Adresse gesendet.",
      intro:
        "Hier kannst Du Dein Passwort ändern. Es muss mindestens 8 Zeichen lang sein. Benutze auch Zahlen und Zeichen, damit es sicherer ist.",
      form: {
        password: {
          label: "Neues Passwort",
        },
        confirmPassword: {
          label: "Passwort wiederholen",
        },
        submit: {
          label: "Passwort ändern",
        },
        showPassword: "Passwort anzeigen",
        hidePassword: "Passwort ausblenden",
      },
      emailNotice: {
        subject: "Dein Passwort wurde geändert",
        headline: "Hallo {{firstName}},",
        message:
          "Die Login Daten Deines MINTvernetzt Profils haben sich geändert. Dein Passwort wurde geändert. Falls Du das nicht warst, kontaktiere bitte den Support unter:",
      },
    },
    changeEmail: {
      headline: "E-Mail ändern",
      feedback:
        "E-Mail Adresse geändert. Es wurde eine Benachrichtigung an die alte E-Mail-Adresse gesendet.",
      intro:
        "Hier kannst Du Deine E-Mail-Adresse für die Anmeldung auf der Community-Plattform ändern.",
      form: {
        email: {
          label: "Neue E-Mail",
        },
        confirmEmail: {
          label: "E-Mail wiederholen",
        },
        submit: {
          label: "E-Mail ändern",
        },
      },
      emailNotice: {
        subject: "Deine E-Mail-Adresse wurde geändert",
        headline: "Hallo {{firstName}},",
        message:
          "Die Login Daten Deines MINTvernetzt Profils haben sich geändert. Deine E-Mail Adresse wurde von {{oldEmail}} auf {{newEmail}} geändert. Falls Du das nicht warst, kontaktiere bitte den Support unter:",
      },
    },
  },
} as const;
