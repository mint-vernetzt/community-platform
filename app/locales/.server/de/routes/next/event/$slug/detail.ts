export const locale = {
  content: {
    back: "Events entdecken",
    jointEvent: "Gemeinsames Event",
    unlimitedSeats: "Unbegrenzte Plätze",
    seatsFree: "Plätze frei",
    waitingListAvailable: "Wartelistenplätze verfügbar",
    copy: "URL kopieren",
    copied: "URL kopiert!",
    onSite: "Vor Ort",
    online: "Online Event",
    hybrid: "Hybrides Event",
    details: "Veranstaltungsdetails",
    participants: "Teilnehmer:innen",
    childEvents: "Zugehörige Veranstaltungen",
    inPast: "Event hat bereits stattgefunden",
    beforeParticipationPeriod:
      "Anmeldefrist beginnt am {{date}} um {{time}} Uhr",
    afterParticipationPeriod: "Anmeldefrist abgelaufen.",
    draft: "Entwurf",
    canceled: "Event abgesagt",
    edit: "Event bearbeiten",
    login: "Anmelden um teilzunehmen",
    participate: "Teilnehmen",
    withdrawParticipation: "Nicht mehr teilnehmen",
    joinWaitingList: "Zur Warteliste hinzufügen",
    leaveWaitingList: "Von der Warteliste entfernen",
    report: "Melden",
    reported: "Meldung wird geprüft",
    reportFaq: "Weitere Infos zum Melden",
    changeBackground: "Hintergrund ändern",
  },
  errors: {
    invalidProfileId: "Ungültige Profil-ID",
    participate: "Fehler beim Hinzufügen zu Teilnehmer:innen",
    withdrawParticipation: "Fehler beim Entfernen von Teilnehmer:innen",
    joinWaitingList: "Fehler beim Hinzufügen zur Warteliste",
    leaveWaitingList: "Fehler beim Entfernen von der Warteliste",
    abuseReport: {
      reasons: {
        required: "Bitte gib einen Grund an.",
      },
      submit: "Fehler beim Absenden der Meldung",
    },
    background: {
      upload:
        "Das Bild konnte nicht gespeichert werden. Bitte versuche es erneut oder wende Dich an den Support.",
    },
  },
  success: {
    participate: "Erfolgreich zu Teilnehmer:innen hinzugefügt",
    withdrawParticipation: "Erfolgreich von Teilnehmer:innen entfernt",
    joinWaitingList: "Erfolgreich zur Warteliste hinzugefügt",
    leaveWaitingList: "Erfolgreich von der Warteliste entfernt",
    abuseReport: "Die Meldung des Events wurde verschickt.",
  },
  abuseReport: {
    title: "Warum möchstest Du dieses Event melden?",
    description:
      "Um Deiner Meldung nachgehen zu  können, benötigen wir den Grund, warum Du dieses Event melden möchtest.",
    faq: `Weitere Infos zum Meldenprozess findest Du in unserem <a href="/help#events-reportEvent" target="_blank" class="text-primary underline hover:no-underline">Hilfebereich</a>.`,
    otherReason: "Anderer Grund",
    maxLength: "Maximal {{max}} Zeichen",
    noReasons: "Bitte gib mindestens einen Grund an.",
    alreadySubmitted: "Du hast dieses Event bereits gemeldet.",
    submit: "Event melden",
    abort: "Abbrechen",
    email: {
      subject: 'Das Profil "{{username}}" hat das Event "{{slug}}" gemeldet',
    },
  },
  changeBackground: {
    title: "Hintergrundbild ändern",
    alt: "Hintergrundbild für das Event {{eventName}}",
    upload: {
      validation: {
        image: {
          size: "Die Bilddatei ist zu groß. Maximal erlaubte Größe ist {{maxSize}} MB.",
          type: "Die Bilddatei hat ein ungültiges Format. Erlaubte Formate sind: {{allowedFormats}}.",
        },
      },
      selection: {
        select: "Bild auswählen",
        empty: "Kein Bild ausgewählt",
      },
    },
    imageCropper: {
      imageCropper: {
        error: "Fehler beim Zuschneiden des Bildes",
        confirmation: "Bild erfolgreich zugeschnitten",
        disconnect: "Verbindung zum Bildbearbeitungsdienst getrennt",
        reset: "Zurücksetzen",
        submit: "Bild zuschneiden",
      },
    },
    success: {
      imageAdded: "{{imageType}} hinzugefügt",
      imageRemoved: "{{imageType}} entfernt",
      imageTypes: {
        background: "Hintergrundbild",
        avatar: "Profilbild",
        logo: "Logo",
      },
    },
  },
} as const;
