export const locale = {
  validation: {
    projectName: {
      required: "Der Projektname ist eine erforderliche Angabe.",
      max: "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 80.",
    },
  },
  error: {
    invariantResponse: "You have to be logged in to access this route",
    unableToCreate:
      "Das Projekt konnte nicht angelegt werden. Bitte versuche es erneut oder wende dich an den Support.",
  },
  content: {
    headline: "Projekt anlegen",
    intro1:
      "Lege Dein Gute-Praxis-Projekt/Bildungsangebot an und inspiriere damit andere MINT-Akteur:innen.",
    intro2:
      "Bitte beachte, dass Du hier nicht Deine Zielgruppe ansprichst, sondern Dein Projekt für MINT-Akteur:innen vorstellst. Lies Dir unsere <0>Nutzungsbedingungen</0> sorgfältig durch, da wir uns das Recht vorbehalten, Inhalte zu löschen.",
    explanation: {
      headline: "*Erforderliche Angaben",
      intro:
        "Du erstellst einen Entwurf, der nur Dir angezeigt wird. Über Projekt bearbeiten kannst Du nach der Entwurfserstellung Dein Projekt mit Informationen anreichern und es anschließend veröffentlichen.",
    },
  },
  form: {
    projectName: {
      label: "Titel des Projekts oder Bildungsangebotes*",
    },
    submit: {
      label: "Entwurf speichern und bearbeiten",
    },
    reset: {
      label: "Entwurf verwerfen",
    },
  },
} as const;
