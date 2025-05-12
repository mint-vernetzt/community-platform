export const locale = {
  content: {
    question: "Bereits Mitglied?",
    login: "Anmelden",
    create: "Mich als Person anlegen",
    success:
      "Dein Profil für <0>{{email}}</0> wurde erstellt. Um die Registrierung abzuschließen, bestätige bitte innerhalb von einer Stunden den Registrierungslink in Deinen E-Mails, den wir Dir über <0>{{systemMail}}</0> zusenden. Bitte sieh auch in Deinem Spam-Ordner nach. Falls Du die E-Mail nicht erhalten hast, kannst Du dich gerne an unseren <1>Support</1> wenden. Hast Du Dich bereits vorher mit dieser E-Mail-Adresse registriert und Dein Passwort vergessen, dann setze hier Dein Passwort zurück:",
    reset: "Passwort zurücksetzen",
  },
  form: {
    intro:
      "Hier kannst Du Dein persönliches Profil anlegen. Die Organisationen, Netzwerke oder Unternehmen, in denen Du tätig bist, können im nächsten Schritt angelegt werden.",
    title: {
      label: "Titel",
      options: {
        none: "Kein Titel",
        dr: "Dr.",
        prof: "Prof.",
        profdr: "Prof. Dr.",
      },
      cta: "Titel auswählen",
    },
    firstName: "Vorname *",
    lastName: "Nachname *",
    email: "E-Mail *",
    password: {
      label: "Passwort *",
      showPassword: "Passwort anzeigen",
      hidePassword: "Passwort ausblenden",
    },
    confirmation:
      "Ich erkläre mich mit der Geltung der <0>Nutzungsbedingungen</0> einverstanden. Die <1>Datenschutzerklärung</1> habe ich zur Kenntnis genommen.",
    submit: "Profil anlegen",
  },
  validation: {
    termsAccepted:
      "Bitte akzeptiere unsere Nutzungsbedingungen und bestätige, dass Du die Datenschutzerklärung gelesen hast.",
    firstName: "Bitte gib Deinen Vornamen ein.",
    lastName: "Bitte gib Deinen Vornamen ein.",
    email: "Bitte gib eine gültige E-Mail-Adresse ein.",
    password: {
      required: "Bitte gib ein Passwort ein.",
      min: "Dein Passwort muss mindestens 8 Zeichen lang sein. Für mehr Sicherheit empfehlen wir eine Mindestlänge von 12 Zeichen mit Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen.",
    },
  },
} as const;
