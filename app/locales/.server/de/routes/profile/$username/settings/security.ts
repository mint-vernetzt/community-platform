export const locale = {
  validation: {
    email: {
      min: "Bitte gib eine gültige E-Mail-Adresse ein.",
      email: "Bitte gib eine gültige E-Mail-Adresse ein.",
    },
    confirmEmail: {
      min: "Bitte gib eine gültige E-Mail-Adresse ein.",
      email: "Bitte gib eine gültige E-Mail-Adresse ein.",
    },
    password: {
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein.",
    },
    confirmPassword: {
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein.",
    },
  },
  error: {
    emailsDontMatch: "Deine E-Mails stimmen nicht überein.",
    notPrivileged: "Not privileged",
    notAllowed: "Not allowed.",
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
      feedback: "Dein Passwort wurde geändert.",
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
      },
    },
    changeEmail: {
      headline: "E-Mail ändern",
      feedback: "Ein Bestätigungslink wurde Dir zugesendet.",
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
    },
  },
} as const;
