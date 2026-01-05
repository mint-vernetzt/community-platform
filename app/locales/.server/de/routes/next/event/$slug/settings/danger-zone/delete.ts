export const locale = {
  explanation:
    "Wenn Du Dein Event löschen möchtest, gib bitte zur Bestätigung den Namen Deines Events <0>{{eventName}}</0> in das vorgesehene Feld ein. Danach klickst Du auf <0>Event löschen</0>.",
  hint: "<0>Bitte beachte</0>: Dein Event wird dann direkt gelöscht, ohne weitere Rückfrage.",
  label: "Name des Events",
  submit: "Event löschen",
  validation: {
    errors: {
      eventNameMismatch:
        "Der eingegebene Name muss mit dem Namen deines Events übereinstimmen.",
    },
  },
  errors: {
    deleteFailed:
      "Beim Löschen des Events ist ein Fehler aufgetreten. Bitte versuche es erneut.",
  },
  success: "Das Event {{eventName}} wurde erfolgreich gelöscht.",
} as const;
