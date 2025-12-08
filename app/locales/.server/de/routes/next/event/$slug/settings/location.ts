export const locale = {
  stageSelection: {
    headline: "Wie soll das Event stattfinden?",
  },
  stage: "Veranstaltungsart",
  venueName: "Name des Veranstaltungsorts",
  venueStreet: "Straße und Hausnummer",
  venueCity: "Stadt",
  venueZipCode: "Postleitzahl",
  conferenceLink: "Konferenzlink",
  conferenceCode: "Zugangscode zur Konferenz",
  accessibilityInformation: {
    label: "Informationen zur Barrierefreiheit",
    helperText:
      "Gibt es etwas, das Teilnehmenden mit Behinderungen den Zugang ermöglicht wie Beispiel Gebärdensprachdolmetschende, Untertitel, Technik-Support, Übersetzung der visuellen Inhalte in gesprochene Inhalte?",
  },
  privacyInformation: {
    label: "Datenschutzinformationen",
    helperText:
      "Hier kannst Du Infos zum Datenschutz bei Deinem Event teilen. Zum Beispiel: Werden Fotos gemacht? Informiere hier, wie Teilnehmende sich sichtbar dagegen entscheiden können (z.B. durch ein farbiges Bändchen). So fühlen sich alle gut informiert – und Du trägst zur vertrauensvollen Atmosphäre bei.",
  },
  reset: "Änderungen verwerfen",
  submit: "Speichern",
  validation: {
    stageRequired: "Bitte wähle eine Veranstaltungsart aus.",
    stageInvalid: "Bitte wähle eine gültige Veranstaltungsart aus.",
  },
  errors: {
    notFound: "Die Veranstaltung wurde nicht gefunden.",
    saveFailed:
      "Beim Speichern der Veranstaltungsorteinstellungen ist ein Fehler aufgetreten. Bitte versuche es später erneut.",
  },
  success: "Veranstaltungsorteinstellungen erfolgreich gespeichert.",
} as const;
