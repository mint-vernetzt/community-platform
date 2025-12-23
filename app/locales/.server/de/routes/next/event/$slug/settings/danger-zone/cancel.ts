export const locale = {
  explanation:
    "Sobald Du das Event absagst, erhalten alle angemeldeten Teilnehmer:innen automatisch eine E-Mail mit der Info zur Absage.",
  hint: "Dein Event ist bereits veröffentlicht. Du hast die Möglichkeit Dein Event abzusagen. Danach wirst Du es hier auch löschen können.",
  cancel: "Event absagen",
  confirmation: {
    title: "Willst Du wirklich {{eventName}} absagen?",
    description: "Diese Aktion kannst Du nicht mehr rückgängig machen. ",
    confirm: "Event absagen",
    abort: "Abbrechen",
  },
  success: "Das Event wurde abgesagt.",
  errors: {
    cancelFailed:
      "Beim Absagen des Events ist ein Fehler aufgetreten. Bitte versuche es erneut.",
  },
} as const;
