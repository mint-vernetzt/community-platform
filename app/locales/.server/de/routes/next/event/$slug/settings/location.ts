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
    coordinatesNotFound:
      'Erfolgreich gespeichert! Allerdings konnten keine Koordinaten zur eingegebenen Adresse gefunden werden. Bitte überprüfe deine Angaben auf Rechtschreibfehler oder versuche Anpassungen bei Schreibweise und Adresszusatz. (Alternativ Eingaben hier prüfen: <a href="https://nominatim.openstreetmap.org/ui/search.html?street={{street}}&city={{city}}&postalcode={{zipCode}}" target="_blank" rel="noopener noreferrer" class="hover:underline text-primary">https://nominatim.openstreetmap.org/ui/search.html?street={{street}}&city={{city}}&postalcode={{zipCode}})</a>',
  },
  success: "Veranstaltungsorteinstellungen erfolgreich gespeichert.",
} as const;
