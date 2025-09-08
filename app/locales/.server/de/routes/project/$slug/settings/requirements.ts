export const locale = {
  validation: {
    timeframe: {
      length:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    jobFillings: {
      length:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    furtherJobFillings: {
      length:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    yearlyBudget: {
      max: "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    furtherFinancings: {
      length:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    technicalRequirements: {
      length:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    furtherTechnicalRequirements: {
      length:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    roomSituation: {
      length:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
    furtherRoomSituation: {
      length:
        "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von {{max}}.",
    },
  },
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    custom:
      "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support.",
  },
  content: {
    notFound: "Not found",
    success: "Daten gespeichert!",
    back: "Rahmenbedingungen",
    intro:
      "Die genannten Informationen zu Finanziellem und personellem Rahmen beziehen sich auf das angegebene Projekt, nicht allgemein auf die Organisation. Die Infos sollen eine Anregung sein für Interessierte, die das Projekt als Inspiration nehmen wollen.",
  },
  form: {
    reset: "Änderungen verwerfen",
    submit: "Speichern",
    timeframe: {
      headline: "Zeitlicher Rahmen",
      label: "Projektstart bzw. Projektlaufzeit",
    },
    personellSituation: {
      headline: "Personelle Situation",
      jobFillings: {
        label: "Stellen und / oder Stundenkontingent",
        helper:
          "Wie viele Menschen sind an der Verwirklichung des Projektes oder Bildungsangebotes beteiligt?",
      },
      furtherJobFillings: {
        label: "Weitere Infos",
        helper:
          "Gibt es noch weitere Punkte, die Du anderen Akteur:innen dazu mitteilen möchtest?",
      },
    },
    budget: {
      headline: "Finanzieller Rahmen",
      yearlyBudget: {
        label: "Jährliches Budget",
        helper:
          "Nutze dieses Freitextfeld um andere Akteur:innen über Eure finanziellen Ressourcen zu informieren.",
      },
      financings: {
        label: "Art der Finanzierung",
        helper: "Wähle die Art der Finanzierung aus.",
        option: "Bitte auswählen",
      },
      furtherFinancings: {
        label: "Weitere Infos",
        helper:
          "Nutze dieses Feld, wenn Du keine passende Finanzierungsart vorgefunden hast.",
      },
    },
    technicalFrame: {
      headline: "Technischer Rahmen",
      technicalRequirements: {
        label:
          "Welche Software/Hardware/Bausätze oder Maschinen kommen zum Einsatz?",
      },
      furtherTechnicalRequirements: {
        label: "Sonstige Erläuterungen",
      },
    },
    spatialSituation: {
      headline: "Räumliche Situation",
      roomSituation: {
        label: "Arbeitsorte",
        helper: "Welche räumliche Situation ist nötig?",
      },
      furtherRoomSituation: {
        label: "Weitere Informationen",
      },
    },
  },
} as const;
