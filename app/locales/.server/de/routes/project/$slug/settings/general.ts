export const locale = {
  validation: {
    name: {
      required: "Der Projektname ist eine erforderliche Angabe.",
      min: "Der Name muss mindestens {{min}} Zeichen lang sein",
      max: "Der Name darf maximal {{max}} Zeichen lang sein",
    },
    subline: {
      max: "Der Projektuntertitel darf maximal {{max}} Zeichen lang sein",
    },
    email: {
      email: "Bitte gib eine gültige E-Mail Adresse ein.",
    },
  },
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    storage:
      "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support.",
    coordinatesNotFound:
      'Erfolgreich gespeichert! Allerdings konnten keine Koordinaten zur eingegebenen Adresse gefunden werden. Bitte überprüfe deine Angaben auf Rechtschreibfehler oder versuche Anpassungen bei Schreibweise und Adresszusatz. (Alternativ Eingaben hier prüfen: <a href="https://nominatim.openstreetmap.org/ui/search.html?street={{street}}&city={{city}}&postalcode={{zipCode}}" target="_blank" rel="noopener noreferrer" class="hover:underline text-primary">https://nominatim.openstreetmap.org/ui/search.html?street={{street}}&city={{city}}&postalcode={{zipCode}})</a>',
  },
  content: {
    notFound: "Not Found",
    feedback: "Daten gespeichert!",
    back: "Eckdaten anlegen",
    intro:
      "Teile der Community Grundlegendes über Dein Projekt oder Bildungsangebot mit.",
    projectTitle: {
      headline: "Projekttitel",
      label: "Titel des Projekts oder Bildungsangebotes*",
      helper: "Mit max. 55 Zeichen wird Dein Projekt gut dargestellt.",
    },
    subline: {
      headline: "Projektuntertitel",
      label: "Subline Deines Projekts oder Bildungsangebotes",
      helper:
        "Mit max. 90 Zeichen wird Dein Projekt in der Übersicht gut dargestellt.",
    },
    formats: {
      headline: "Projektformat",
      label: "In welchem Format findet das Projekt statt?",
      choose: "Bitte auswählen",
    },
    furtherFormats: {
      label: "Sonstige Formate",
      helper: "Bitte gib kurze Begriffe an.",
      add: "Hinzufügen",
    },
    areas: {
      headline: "Aktivitätsgebiete",
      label: "Wo wird das Projekt/Bildungsangebot durchgeführt?",
      option: "Bitte auswählen",
    },
    contact: {
      headline: "Kontaktdaten",
      email: {
        label: "E-Mail-Adresse",
      },
      phone: {
        label: "Telefonnummer",
      },
    },
    address: {
      headline: "Anschrift",
      contactName: {
        label: "Name",
      },
      street: {
        label: "Straße und Hausnummer",
      },
      zipCode: {
        label: "PLZ",
      },
      city: {
        label: "Stadt",
      },
    },
    reset: "Änderungen verwerfen",
    submit: "Speichern",
    hint: "*Erforderliche Angaben",
  },
} as const;
