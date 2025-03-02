export const locale = {
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
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
    image: {
      description: {
        max: "Die Bildbeschreibung darf maximal {{max}} Zeichen lang sein.",
      },
      credits: {
        max: "Die Angabe der Urheber:in darf maximal {{max}} Zeichen lang sein.",
      },
    },
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
      type: "Mögliche Dateiformate: PDF. Maximal {{max}}MB.",
      action: "Datei hochladen",
      added: "{{name}} hinzugefügt",
      current: "Aktuell hochgeladene Dokumente",
      downloadAll: "Alle herunterladen",
      empty: "Keine Dokumente vorhanden.",
      deleted: "{{name}} gelöscht.",
      updated: "{{name}} aktualisiert.",
    },
    image: {
      upload: "Bildmaterial hochladen",
      requirements: "Mögliche Dateiformate: jpg, png. Maximal 6MB.",
      action: "Datei hochladen",
      added: "{{name}} hinzugefügt",
      current: "Aktuell hochgeladenes Bildmaterial",
      downloadAll: "Alle herunterladen",
      empty: "Keine Bilder vorhanden.",
      deleted: "{{name}} gelöscht.",
      updated: "{{name}} aktualisiert.",
    },
  },
} as const;
