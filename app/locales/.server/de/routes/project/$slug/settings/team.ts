export const locale = {
  error: {
    invalidRoute: "No valid route",
    notFound: "Not found",
  },
  content: {
    added: "{{firstName}} {{lastName}} hinzugefügt.",
    removed: "{{firstName}} {{lastName}} entfernt.",
    back: "Team verwalten",
    intro:
      "Wer ist Teil Eures Projekts? Füge hier weitere Teammitglieder hinzu oder entferne sie. Team-Mitglieder werden auf der Projekte-Detailseite gezeigt. Sie können Projekte nicht bearbeiten.",
    current: {
      headline: "Aktuelle Teammitglieder",
      intro: "Teammitglieder und Rollen sind hier aufgelistet.",
      member: {
        admin: "Administrator:in",
        team: "Teammitglied",
      },
      remove: "Entfernen",
    },
    add: {
      headline: "Teammitglied hinzufügen",
      search: "Suche",
      requirements: "Mindestens 3 Buchstaben.",
      add: "Hinzufügen",
    },
  },
} as const;
