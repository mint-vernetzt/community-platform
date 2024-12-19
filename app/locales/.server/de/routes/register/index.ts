export const locale = {
  content: {
    question: "Bereits Mitglied?",
    login: "Anmelden",
    create: "Neues Profil anlegen",
    success:
      "Das Profil für <b>{{email}}</b> wurde erstellt. Um die Registrierung abzuschließen, bestätige bitte innerhalb von 24 Stunden den Registrierungslink in Deinen E-Mails, den wir Dir über <b>noreply@mint-vernetzt.de</b> zusenden. Bitte sieh auch in Deinem Spam-Ordner nach. Hast Du Dich bereits vorher mit dieser E-Mail-Adresse registriert und Dein Passwort vergessen, dann setze hier Dein Passwort zurück:",
    reset: "Passwort zurücksetzen",
  },
  form: {
    intro:
      "Hier kannst Du Dein persönliches Profil anlegen. Die Organisationen, Netzwerke oder Unternehmen, in denen Du tätig bist, können im nächsten Schritt angelegt werden.",
    title: {
      label: "Titel",
      options: {
        dr: "Dr.",
        prof: "Prof.",
        profdr: "Prof. Dr.",
      },
    },
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    password: "Passwort",
    acknowledgements: {
      intro: "Ich erkläre mich mit der Geltung der",
      termsOfUse: "Nutzungsbedingungen",
      bridge: " einverstanden. Die",
      dataProtection: "Datenschutzerklärung",
      outro: "habe ich zur Kenntnis genommen.",
    },
    submit: "Profil anlegen",
  },
  validation: {
    termsAccepted:
      "Bitte akzeptiere unsere Nutzungsbedingungen und bestätige, dass Du die Datenschutzerklärung gelesen hast.",
    firstName: {
      min: "Bitte gib Deinen Vornamen ein.",
    },
    lastName: {
      min: "Bitte gib Deinen Vornamen ein.",
    },
    email: {
      email: "Bitte gib eine gültige E-Mail-Adresse ein.",
      min: "Bitte gib eine gültige E-Mail-Adresse ein.",
    },
    password: {
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein. Benutze auch Zahlen und Zeichen, damit es sicherer ist.",
    },
  },
} as const;
