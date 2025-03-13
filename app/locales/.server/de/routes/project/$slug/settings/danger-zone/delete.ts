export const locale = {
  validation: {
    name: {
      noMatch: "Der eingegebene Projektname stimmt nicht überein.",
      required: "Bitte gib den Namen des Projekts ein.",
    },
  },
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    deletionFailed:
      "Das Projekt konnte nicht gelöscht werden. Bitte versuche es erneut oder kontaktiere den Support.",
  },
  content: {
    deleted: 'Projekt "{{name}}" gelöscht.',
    confirmation:
      "Bitte gib den Namen des Projekts <0>{{name}}</0> ein, um das Löschen zu bestätigen.",
    explanation:
      'Wenn Du danach auf "Projekt löschen" klickst, wird Euer Projekt ohne erneute Abfrage gelöscht.',
    label: "Löschen bestätigen",
    placeholder: "Projektname eingeben",
    action: "Projekt löschen",
    success: "Dein Projekt {{name}} wurde erfolgreich gelöscht.",
  },
} as const;
