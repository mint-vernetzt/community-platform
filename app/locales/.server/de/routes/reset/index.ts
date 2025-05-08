export const locale = {
  login: "Anmelden",
  validation: {
    email: "Bitte gib eine gültige E-Mail-Adresse ein.",
  },
  response: {
    headline: "Passwort zurücksetzen",
    success:
      'Eine E-Mail zum Zurücksetzen des Passworts wurde an <0>{{email}}</0> gesendet. Um das Passwort zurückzusetzen, klicke bitte innerhalb von einer Stunde den "Passwort zuzücksetzen"-Link, den wir Dir über <0>{{systemMail}}</0> zusenden. Bitte sieh auch in Deinem Spam-Ordner nach. Falls Du die E-Mail nicht erhalten hast, kannst Du dich gerne an unseren <1>Support</1> wenden.',
    notice:
      "Solltest Du Dich noch nicht unter dieser E-Mail-Adresse registriert haben, erhältst Du keine E-Mail zum Zurücksetzen des Passworts. Das gleiche gilt, wenn Du über die <0>MINT-ID</0> registriert bist. In diesem Fall kannst Du das Passwort auf <1>mint-id.org</1> zurücksetzen.",
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
