export const locale = {
  title: "Aktuelle hochgeladene Dokumente",
  list: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    searchPlaceholder: "Nach Dokumenten suchen...",
    remove: "Entfernen",
    edit: "Editieren",
    editModal: {
      headline: "Dokument editieren",
      title: {
        label: "Titel",
        helperText:
          "Schreibe wie Dein Dokument beim Download angezeigt werden soll.",
      },
      description: {
        label: "Beschreibung des Dokuments",
        helperText:
          "Wenn es durch den Titel des Dokuments nicht ersichtlich ist, schreibe eine kurze Info worum es sich handelt.",
      },
      submit: "Speichern",
      close: "Verwerfen",
    },
    download: "Download",
    downloadAll: "Alle herunterladen",
    overlayMenu: "Schließen",
  },
  errors: {
    removeDocumentFailed: "Das Entfernen des Dokuments ist fehlgeschlagen.",
    updateDocumentFailed: "Das Aktualisieren des Dokuments ist fehlgeschlagen.",
  },
  success: {
    removeDocument: "Das Dokument wurde erfolgreich entfernt.",
    updateDocument: "Das Dokument wurde erfolgreich aktualisiert.",
  },
} as const;
