export const locale = {
  title: "Titelbild ändern",
  fileExplanation: "Mögliche Dateiformate: JPG, PNG (maximal {{size}} MB)",
  aspectExplanation:
    "Größenverhältnis: Querformat ({{aspectRatio}}), empfohlene Mindestbreite {{minWidth}} px",
  currentBackground: {
    title: "Aktuelles Titelbild",
    remove: "Titelbild entfernen",
  },
  changeBackground: {
    pick: "Datei auswählen",
    crop: {
      zoomIn: "Hineinzoomen",
      zoomOut: "Herauszoomen",
      move: "Verschieben",
    },
    description: {
      label: "Bildbeschreibung",
      placeholder: "Beschreibe Dein Bild in Kürze.",
      helperText:
        "Deine Beschreibung hilft Menschen mit Sehbehinderung Dein Bild zu verstehen.",
    },
    credits: {
      label: "Bildnachweis",
      placeholder: "Gebe an, wer Dein Bild erstellt hat.",
      helperText: "Nenne den / die Urheber:in des Bildes.",
    },
    submit: "Änderungen speichern",
    discard: "Änderungen verwerfen",
  },
  toMediaDatabase: {
    hint: "Tipp: Wähle ein Bild aus der MINT-Mediendatenbank aus, lade es herunter und füge es hier ein.",
    cta: "Zur MINT-Mediendatenbank",
  },
  validation: {
    maxSize: "Dein Bild ist zu groß ({{size}} MB).",
    invalidType: "Die Datei muss ein JPG oder PNG sein.",
    descriptionTooLong:
      "Die Bildbeschreibung darf maximal {{max}} Zeichen lang sein.",
    creditsTooLong: "Der Bildnachweis maximal {{max}} Zeichen lang sein.",
  },
  errors: {
    uploadImageFailed: "Das Hochladen des Bildes ist fehlgeschlagen.",
    removeImageFailed: "Das Entfernen des Bildes ist fehlgeschlagen.",
  },
  success: {
    imageAdded: "Titelbild gespeichert.",
    imageRemoved: "Titelbild entfernt.",
  },
} as const;
