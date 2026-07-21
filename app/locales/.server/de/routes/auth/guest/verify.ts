export const locale = {
  confirmation: {
    subject: "Du hast Dich erfolgreich für eine Veranstaltung angemeldet",
    success: {
      participant:
        "Du bist nun als Teilnehmer:in für die Veranstaltung angemeldet.",
      waitingList:
        "Du bist nun auf der Warteliste für die Veranstaltung angemeldet.",
    },
    notFound: {
      title: "Kein Gast gefunden",
      description:
        "Es konnte kein Gast für das angegebene Token gefunden werden. Es könnte sein, dass Du Deine Anmeldung bereits bestätigt hast. Bitte überprüfe Dein E-Mail-Postfach und ggf. auch den Spam-Ordner. Wenn Du keine E-Mail erhalten hast, wende Dich bitte an unseren <0>Support</0>.",
    },
  },
  revocation: {
    subject: "Du hast Dich erfolgreich von der Veranstaltung abgemeldet",
    success: {
      participant: "Du hast Dich erfolgreich von der Veranstaltung abgemeldet.",
    },
    notFound: {
      title: "Kein Gast gefunden",
      description:
        "Es konnte kein Gast für das angegebene Token gefunden werden. Es könnte sein, dass Du Deine Anmeldung bereits widerrufen hast. Bitte überprüfe Dein E-Mail-Postfach und ggf. auch den Spam-Ordner. Wenn Du keine E-Mail erhalten hast, wende Dich bitte an unseren <0>Support</0>.",
    },
  },
} as const;
