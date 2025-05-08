export const locale = {
  validation: {
    email: "Bitte gib eine gültige E-Mail-Adresse ein.",
  },
  content: {
    headline: "Bestätigungslink anfordern",
    description:
      'Dein Bestätigungslink ist abgelaufen. Denk daran, dass er nur 1 Stunde gültig ist. Hier kannst Du einen neuen anfordern, indem du Deine E-Mail-Adresse eingibst und auf "Bestätigungslink anfordern" klickst.',
    emailLabel: "E-Mail",
    cta: "Bestätigungslink anfordern",
    success:
      "Eine E-Mail mit dem neuen Bestätigungslink wurde an <0>{{email}}</0> gesendet. Um die Registrierung abzuschließen, bestätige bitte innerhalb von einer Stunden den Registrierungslink in Deinen E-Mails, den wir Dir über <0>{{systemMail}}</0> zusenden. Bitte sieh auch in Deinem Spam-Ordner nach. Falls Du die E-Mail nicht erhalten hast, kannst Du dich gerne an unseren <1>Support</1> wenden.",
  },
} as const;
