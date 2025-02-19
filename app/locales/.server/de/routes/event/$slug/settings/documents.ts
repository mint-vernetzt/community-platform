export const locale = {
  error: {
    invalidRoute: "No valid route",
    eventNotFound: "Event not found",
    invalidSubmission: "No valid submission",
    invalidAction: "No valid action",
    onStoring:
      "Datei konnte nicht gespeichert werden. Versuche es erneut oder wende dich an den Support.",
    onUpdating:
      "Datei konnte nicht angepasst werden. Versuche es erneut oder wende dich an den Support.",
  },
  validation: {
    document: {
      description: {
        max: "Die Beschreibung des Dokuments darf maximal {{max}} Zeichen lang sein.",
      },
    },
  },
  content: {
    headline: "Dokumente verwalten",
    editModal: {
      editDocument: "Dokument editieren",
      title: "Titel",
      description: {
        label: "Beschreibung",
      },
      submit: "Speichern",
      reset: "Verwerfen",
    },
    description:
      "Füge Materialien wie Agendas, Lagepläne, Checklisten zu Deinem Event hinzu oder entferne sie.",
    document: {
      upload: "Dokumente hochladen",
      type: "Mögliche Dateiformate: PDF. Maximal {{max}}MB.",
      select: "Datei auswählen",
      action: "Datei hochladen",
      selection: {
        empty: "Du hast keine Datei ausgewählt.",
        selected: "{{name}} ausgewählt.",
      },
      added: "{{name}} hinzugefügt",
      current: "Aktuell hochgeladene Dokumente",
      downloadAll: "Alle herunterladen",
      empty: "Keine Dokumente vorhanden.",
      deleted: "{{name}} gelöscht.",
      updated: "{{name}} aktualisiert.",
    },
    form: {
      publish: {
        label: "Veröffentlichen",
      },
      hide: {
        label: "Verstecken",
      },
    },
  },
} as const;
