export const locale = {
  title: "Lade Dokumente hoch",
  explanation: "Mögliche Dateiformate: PDF (maximal {{size}} MB)",
  help: "Hilfe zur Erstellung von barrierefreien Dokumenten findest Du in unserem <0>Hilfebereich</0>.",
  add: {
    pick: "Datei auswählen",
    list: {
      more: "{{count}} weitere anzeigen",
      less: "{{count}} weniger anzeigen",
    },
    clearFileInput: "Dateiauswahl zurücksetzen",
    title: {
      label: "Titel",
      helperText:
        "Schreibe wie Dein Dokument beim Download angezeigt werden soll.",
    },
    description: {
      label: "Beschreibung",
      helperText:
        "Wenn es durch den Titel des Dokuments nicht ersichtlich ist, schreibe eine kurze Info worum es sich handelt.",
    },
    upload: "Datei hochladen",
    cancel: "Abbrechen",
  },
  validation: {
    maxSize: "Die Datei darf nicht größer als {{size}} MB sein.",
    invalidType: "Die Datei muss ein PDF sein.",
    descriptionTooLong:
      "Die Beschreibung darf maximal {{max}} Zeichen lang sein.",
  },
  errors: {
    uploadDocumentFailed: "Das Hochladen des Dokuments ist fehlgeschlagen.",
  },
  success: {
    documentAdded: "{{name}} hinzugefügt",
  },
} as const;
