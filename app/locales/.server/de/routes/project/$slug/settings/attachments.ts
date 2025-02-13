export const locale = {
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    invalidSubmission: "No valid submission",
    invalidAction: "No valid action",
    onStoring:
      "Datei konnte nicht gespeichert werden. Versuche es erneut oder wende dich an den Support.",
  },
  content: {
    editModal: {
      editDocument: "Dokument editieren",
      editImage: "Fotoinformation editieren",
      title: "Titel",
      credits: {
        label: "Credits",
        helper: "Bitte nenne hier den oder die Urheber:in des Bildes",
      },
      description: {
        label: "Beschreibung",
        helper:
          "Hilf blinden Menschen mit Deiner Bildbeschreibung zu verstehen, was auf dem Bild zu sehen ist.",
      },
      submit: "Speichern",
      reset: "Verwerfen",
    },
    back: "Material verwalten",
    description:
      "Füge Materialien wie Flyer, Bilder, Checklisten zu Deinem Projekt hinzu oder entferne sie.",
    document: {
      upload: "Dokumente hochladen",
      type: "Mögliche Dateiformate: PDF, jpg. Maximal 6MB.",
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
    },
    image: {
      upload: "Bildmaterial hochladen",
      requirements: "Mögliche Dateiformate: jpg, png. Maximal 6MB.",
      select: "Datei auswählen",
      action: "Datei hochladen",
      selection: {
        empty: "Du hast keine Datei ausgewählt.",
        selected: "{{name}} ausgewählt.",
      },
      added: "{{name}} hinzugefügt",
      current: "Aktuell hochgeladenes Bildmaterial",
      downloadAll: "Alle herunterladen",
      empty: "Keine Bilder vorhanden.",
      deleted: "{{name}} gelöscht.",
    },
  },
} as const;
