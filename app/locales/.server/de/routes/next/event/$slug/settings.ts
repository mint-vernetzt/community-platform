export const locale = {
  mobileHeadline: "Einstellungen",
  desktopHeadline: "Event bearbeiten",
  close: "Zum Event",
  back: "Zurück zum Menü",
  publishHint: "Dein Event ist im Entwurfsmodus nicht öffentlich sichtbar.",
  publishCta: "Event veröffentlichen",
  menu: {
    admins: "Administrator:innen",
    dangerZone: "Kritischer Bereich",
    details: "Event Details",
    documents: "Dokumente verwalten",
    location: "Ort und Zugänglichkeit",
    participants: "Teilnehmende",
    registration: "Registrierung",
    relatedEvents: "Zugehörige Events",
    responsibleOrgs: "Verantwortliche Organisationen",
    speakers: "Speaker:innen",
    team: "Team",
    timePeriod: "Datum und Uhrzeit",
  },
  menuHints: {
    participantsDisabledUntilPublished:
      "Sobald Dein Event veröffentlicht ist, kannst Du hier Deine Teilnehmenden verwalten.",
    inviteParticipants: "Lade Teilnehmende ein",
    waitingListHasMembers: "Personen auf der Warteliste",
    externalEvent: "Dieses Event wird extern verwaltet",
    multiple: "Ergänze Informationen",
  },
  errors: {
    invalidIntent: "Diese Aktion ist nicht zulässig",
    publishFailed:
      "Das Veröffentlichen der Veranstaltung ist fehlgeschlagen. Bitte versuche es später erneut oder kontaktiere den Support.",
  },
  publishSuccess: "Event veröffentlicht!",
  modal: {
    publishEventModal: {
      withIssues: {
        headline: "Ergänzungen empfohlen",
        description:
          "Du kannst Dein Event veröffentlichen, jedoch empfehlen wir vorher noch folgende Angaben in den Einstellungen zu ergänzen:",
        submit: "Trotzdem veröffentlichen",
        cancel: "Zurück zu den Einstellungen",
      },
      noIssues: {
        headline: "Event veröffentlichen",
        description:
          "Super! Dein Event ist vollständig ausgefüllt und bereit zur Veröffentlichung.",
        hint: "<0>Hinweis</0>: Nach der Veröffentlichung ist Dein Event für Nutzer:innen sichtbar und kann nicht mehr in den Entwurf zurückgesetzt werden. Bei Bedarf kannst Du das Event später noch absagen und löschen.",
        submit: "Jetzt veröffentlichen",
        cancel: "Abbrechen",
      },
    },
  },
  issues: {
    registration: {
      missingExternalRegistrationUrl: "Externer Registrierungslink hinterlegen",
    },
    details: {
      missingDescriptionAndSubline: "Ergänze Kurzinfo und Beschreibung",
      missingKeywordsAndTags: "Ergänze Schlagworte / Tags",
      missingBackgroundImage: "Ergänze ein Titelbild",
    },
    location: {
      missingAddress: "Keine Adresse angegeben",
      missingConferenceLink: "Kein Konferenzlink angegeben",
      missingAddressAndConferenceLink: "Adresse und Konferenzlink fehlen",
    },
  },
} as const;
