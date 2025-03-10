export const locale = {
  error: {
    invariant: {
      invalidRoute: "No valid route",
      notFound: "Not found",
    },
  },
  content: {
    profileAdded: "{{firstName}} {{lastName}} hinzugefügt",
    profileRemoved: "{{firstName}} {{lastName}} entfernt",
    headline: "Admin-Rollen verwalten",
    intro:
      "Wer verwaltet dieses Projekt auf der Community Plattform? Füge hier weitere Administrator:innen hinzu oder entferne sie. Administrator:innen können Projekte anlegen, veröffentlichen, verstecken, bearbeiten, löschen, sowie Team-Mitglieder hinzufügen. Sie sind nicht auf der Projekt-Detailseite sichtbar. Team-Mitglieder werden auf der Projekt-Detailseite gezeigt. Sie können unveröffentlichte Projekte sehen aber nicht bearbeiten.",
    ups: {
      add: "Beim Hinzufügen ist etwas schief gelaufen",
      remove: "Beim Entfernen ist etwas schief gelaufen",
    },
    current: {
      headline_one: "Administrator:in",
      headline_other: "Administrator:innen",
      title: "Administrator:in",
      remove: "Entfernen",
    },
    add: {
      headline: "Administrator:in hinzufügen",
      search: "Suche",
      criteria: "Mindestens 3 Buchstaben.",
      submit: "Hinzufügen",
    },
  },
} as const;
