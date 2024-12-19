export const locale = {
  validation: {
    name: {
      noMatch: "Der eingegebene Projektname stimmt nicht überein.",
    },
  },
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
  },
  content: {
    deleted: 'Projekt "{{name}}" gelöscht.',
    confirmation:
      "Bitte gib den Namen des Projekts <0>{{name}}</0> ein, um das Löschen zu bestätigen.",
    explanation:
      'Wenn Du danach auf "Projekt löschen” klickst, wird Euer Projekt ohne erneute Abfrage gelöscht.',
    label: "Löschen bestätigen",
    action: "Projekt löschen",
    success: "Dein Projekt {{name}} wurde erfolgreich gelöscht.",
  },
} as const;
