export const locale = {
  title: "Titelbild ändern",
  fileExplanation: "Mögliche Dateiformate: JPG, PNG (maximal {{size}} MB)",
  aspectExplanation:
    "Größenverhältnis: Querformat ({{aspectRatio}}), empfohlene Mindestbreite {{minWidth}} px",
  currentBackground: {
    title: "Aktuelles Titelbild",
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
      label: "Credits",
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
} as const;
