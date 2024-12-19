export const locale = {
  error: {
    notFound: "Organisation oder Sichtbarkeit der Organisation nicht gefunden",
    invalidRoute: "Ungültige Route",
    updateFailed:
      "Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support",
  },
  validation: {
    name: {
      required:
        "Bitte gib den Namen Deiner Organisation oder Deines Netzwerks ein",
      min: "Der Name muss mindestens 3 Zeichen lang sein",
      max: "Der Name darf maximal 50 Zeichen lang sein",
    },
    email: "Bitte gib eine gültige E-Mail Adresse ein",
    bio: {
      max: "Die Beschreibung darf maximal 2000 Zeichen lang sein",
    },
  },
  content: {
    notFound: "Nicht gefunden",
    back: "Zurück zur Organisation",
    success: "Daten gespeichert!",
    contact: {
      headline: "Name und Kontakt",
      name: {
        label: "Wie heißt Deine Organisation / Dein Netzwerk?",
      },
      email: {
        label: "E-Mail-Adresse",
      },
      phone: {
        label: "Telefonnummer",
      },
      street: {
        label: "Straße",
      },
      streetNumber: {
        label: "Hausnummer",
      },
      zipCode: {
        label: "Postleitzahl",
      },
      city: {
        label: "Stadt",
      },
    },
    about: {
      headline: "Über uns",
      intro:
        "Teile der Community Grundlegendes über Deine Organisation oder Netzwerk mit.",
    },
    bio: {
      label: "Kurzbeschreibung",
    },
    areas: {
      label: "Aktiviätsgebiete",
      helper: "Mehrfachauswahl möglich",
      option: "Bitte auswählen",
    },
    focuses: {
      label: "Schwerpunkte",
      helper: "Mehrfachauswahl möglich",
      option: "Bitte auswählen",
    },
    supportedBy: {
      headline: "Fördermittelgeber",
      label: "Gefördert von",
      add: "Hinzufügen",
    },
  },
  form: {
    reset: "Änderungen verwerfen",
    submit: "Speichern",
    hint: {
      public: "Für alle sichtbar",
      private: "Nur für registrierte Nutzer:innen sichtbar",
    },
  },
} as const;
