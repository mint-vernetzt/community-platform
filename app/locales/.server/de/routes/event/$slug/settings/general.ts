export const locale = {
  validation: {
    name: {
      required: "Bitte gib den Namen des Events an",
    },
    startDate: {
      required: "Bitte gib den Beginn des Events an",
    },
    startTime: {
      required: "Bitte gib den Beginn des Events an",
    },
    endDate: {
      required: "Bitte gib das Ende des Events an",
      greaterThan: "Das Enddatum darf nicht vor dem Startdatum liegen",
    },
    endTime: {
      required: "Bitte gib das Ende des Events an",
      greaterThan:
        "Das Event findet an einem Tag statt. Dabei darf die Startzeit nicht nach der Endzeit liegen",
    },
    participationUntilDate: {
      required: "Bitte gib das Ende für die Registrierung an",
      greaterThan:
        "Das Registrierungsende darf nicht vor dem Registrierungsstart liegen",
    },
    participationUntilTime: {
      required: "Bitte gib das Ende für die Registrierung an",
      greaterThan:
        "Die Registrierungsphase findet an einem Tag statt. Dabei darf der Registrierungsstart nicht nach dem Registrierungsende liegen",
    },
    participationFromDate: {
      required: "Bitte gib den Beginn für die Registrierung an",
      greaterThan:
        "Das Startdatum darf nicht vor dem Registrierungsstart liegen",
    },
    participationFromTime: {
      required: "Bitte gib den Beginn für die Registrierung an",
      greaterThan:
        "Die Registrierungsphase startet am selben Tag wie das Event. Dabei darf der Registrierungsstart nicht nach dem Eventstart liegen.",
    },
  },
  error: {
    notFound: "Event not found",
    notPrivileged: "Not privileged",
  },
  content: {
    headline: "Dein Event",
    start: {
      headline: "Start und Registrierung",
      intro:
        "Wann startet Dein Event, wie lange dauert es und wie viele Personen können teilnehmen? Hier kannst Du Einstellungen rund um das Thema Start und Registrierung vornehmen. Außerdem kannst Du das Event veröffentlichen oder verstecken und gegebenenfalls absagen.",
    },
    cancel: "Absagen",
    revert: "Absage rückgängig machen",
    location: "Veranstaltungsort",
    generic: {
      headline: "Allgemein",
      intro:
        "Wie heißt Dein Event? Was können potentiell Teilnehmende erwarten und wen möchtest Du damit abholen? Nehme hier allgemeine Einstellungen vor, wie beispielsweise der Name, die Beschreibung oder Zielgruppen und Inhalte Deines Events. Hier kannst Du außerdem Schlagworte und die Veranstaltungstypen festlegen.",
    },
    feedback: "Informationen wurden aktualisiert.",
  },
  form: {
    startDate: {
      label: "Startet am",
    },
    startTime: {
      label: "Startet um",
    },
    endDate: {
      label: "Endet am",
    },
    endTime: {
      label: "Endet um",
    },
    participationFromDate: {
      label: "Registrierung startet am",
    },
    participationFromTime: {
      label: "Registrierung startet um",
    },
    participationUntilDate: {
      label: "Registrierung endet am",
    },
    participationUntilTime: {
      label: "Registrierung endet um",
    },
    stage: {
      label: "Veranstaltungstyp",
      placeholder: "Wähle den Veranstaltungstyp aus.",
    },
    venueName: {
      label: "Name des Veranstaltungsorts",
    },
    venueStreet: {
      label: "Straßenname",
    },
    venueStreetNumber: {
      label: "Hausnummer",
    },
    venueZipCode: {
      label: "PLZ",
    },
    venueCity: {
      label: "Stadt",
    },
    conferenceLink: {
      label: "Konferenzlink",
    },
    conferenceCode: {
      label: "Zugangscode zur Konferenz",
    },
    name: {
      label: "Name",
    },
    subline: {
      label: "Subline",
    },
    description: {
      label: "Beschreibung",
    },
    types: {
      label: "Veranstaltungstypen",
      placeholder: "Füge die Veranstaltungstypen hinzu.",
    },
    tags: {
      label: "Schlagworte",
      placeholder: "Füge die Schlagworte hinzu.",
    },
    targetGroups: {
      label: "Zielgruppen",
      placeholder: "Füge die Zielgruppen hinzu.",
    },
    experienceLevel: {
      label: "Erfahrungsstufe",
      placeholder: "Wähle die Erfahrungsstufe aus.",
    },
    focuses: {
      label: "MINT-Schwerpunkte",
      placeholder: "Füge die MINT-Schwerpunkte hinzu.",
    },
    reset: {
      label: "Änderungen verwerfen",
    },
    submit: {
      label: "Speichern",
    },
    publish: {
      label: "Veröffentlichen",
    },
    hide: {
      label: "Verstecken",
    },
  },
} as const;
