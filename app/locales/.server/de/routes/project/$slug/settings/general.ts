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
  },
  content: {
    notFound: "Not Found",
    feedback: "Daten gespeichert!",
    prompt:
      "Du hast ungespeicherte Änderungen. Diese gehen verloren, wenn Du jetzt einen Schritt weiter gehst.",
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
      helper: "Mehrfachnennungen sind möglich.",
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
      helper: "Mehrfachnennungen sind möglich.",
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
        label: "Straße",
      },
      streetNumber: {
        label: "Hausnummer",
      },
      streetNumberAddition: {
        label: "Zusatz",
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
