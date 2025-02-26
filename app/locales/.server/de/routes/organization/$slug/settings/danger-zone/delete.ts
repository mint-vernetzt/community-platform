export const locale = {
  validation: {
    name: {
      noMatch: "Der eingegebene Organisationsname stimmt nicht überein.",
      required: "Bitte gib den Namen der Organisation ein.",
    },
  },
  error: {
    invalidRoute: "No valid route",
    organizationNotFound: "Organization not found",
    deletionFailed:
      "Die Organisation konnte nicht gelöscht werden. Bitte versuche es erneut oder kontaktiere den Support.",
  },
  content: {
    deleted: 'Organisation "{{name}}" gelöscht.',
    confirmation:
      "Bitte gib den Namen der Organisation <0>{{name}}</0> ein, um das Löschen zu bestätigen.",
    explanation:
      'Wenn Du danach auf "Organisation löschen" klickst, wird Eure Organisation ohne erneute Abfrage gelöscht.',
    label: "Löschen bestätigen",
    placeholder: "Organisationsname eingeben",
    action: "Organisation löschen",
    success: "Deine Organisation {{name}} wurde erfolgreich gelöscht.",
  },
} as const;
